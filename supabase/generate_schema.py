#!/usr/bin/env python3
"""Gera supabase/schema.sql a partir do banco remoto ou das migrations locais.

Prioridade:
1. supabase db dump --db-url (DATABASE_URL / SUPABASE_DB_URL / DIRECT_URL no .env)
2. Fallback: concatena migrations/*.sql em ordem lexica numerica

Uso:
  python supabase/generate_schema.py
  python supabase/generate_schema.py --from-migrations   # forca fallback local

Execute apos criar ou alterar qualquer arquivo em supabase/migrations/.
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from datetime import UTC, datetime
from pathlib import Path

SUPABASE_DIR = Path(__file__).resolve().parent
WORKSPACE_DIR = SUPABASE_DIR.parent
MIGRATIONS_DIR = SUPABASE_DIR / "migrations"
SCHEMA_FILE = SUPABASE_DIR / "schema.sql"
ENV_CANDIDATES = (
    WORKSPACE_DIR / ".env",
    WORKSPACE_DIR / "mgi-kpi-pipeline" / ".env",
    WORKSPACE_DIR / "mgi-kpi-dashboard" / ".env.local",
)

DB_URL_KEYS = (
    "DATABASE_URL",
    "SUPABASE_DB_URL",
    "DIRECT_URL",
    "POSTGRES_URL",
    "SUPABASE_DATABASE_URL",
)


def load_dotenv() -> None:
    for path in ENV_CANDIDATES:
        if not path.exists():
            continue
        for raw_line in path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            if key and key not in os.environ:
                os.environ[key] = value.strip().strip('"').strip("'")


def resolve_db_url() -> str | None:
    for key in DB_URL_KEYS:
        value = os.environ.get(key, "").strip()
        if value:
            return value
    return None


def migration_files() -> list[Path]:
    if not MIGRATIONS_DIR.is_dir():
        raise FileNotFoundError(f"Diretorio de migrations nao encontrado: {MIGRATIONS_DIR}")
    files = sorted(MIGRATIONS_DIR.glob("*.sql"), key=_migration_sort_key)
    if not files:
        raise FileNotFoundError(f"Nenhuma migration em {MIGRATIONS_DIR}")
    return files


def _migration_sort_key(path: Path) -> tuple[int, str]:
    match = re.match(r"^(\d+)", path.name)
    number = int(match.group(1)) if match else 9999
    return number, path.name


def build_schema_from_migrations() -> str:
    files = migration_files()
    generated_at = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")
    parts = [
        "-- =============================================================================",
        "-- schema.sql (gerado automaticamente)",
        f"-- Gerado em: {generated_at}",
        "-- Fonte: concatenacao ordenada de supabase/migrations/*.sql",
        "--",
        "-- IMPORTANTE: apos criar/editar uma migration, regenere com:",
        "--   python supabase/generate_schema.py",
        "-- Preferencialmente com DATABASE_URL no .env para dump fiel do banco.",
        "-- =============================================================================",
        "",
        "SET statement_timeout = 0;",
        "SET lock_timeout = 0;",
        "SET client_encoding = 'UTF8';",
        "SET standard_conforming_strings = on;",
        "",
    ]
    for migration in files:
        body = migration.read_text(encoding="utf-8").strip()
        parts.extend(
            [
                "",
                "-- -----------------------------------------------------------------------------",
                f"-- migration: {migration.name}",
                "-- -----------------------------------------------------------------------------",
                "",
                body,
                "",
            ]
        )
    parts.append("-- fim schema.sql")
    parts.append("")
    return "\n".join(parts)


def dump_schema_from_database(db_url: str) -> None:
    SCHEMA_FILE.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        "supabase",
        "db",
        "dump",
        "--db-url",
        db_url,
        "-f",
        str(SCHEMA_FILE),
        "--workdir",
        str(SUPABASE_DIR),
        "--yes",
    ]
    subprocess.run(cmd, check=True, capture_output=True, text=True)
    prepend_generation_header(from_source="supabase db dump (banco remoto)")


def prepend_generation_header(from_source: str) -> None:
    if not SCHEMA_FILE.exists():
        return
    generated_at = datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S UTC")
    original = SCHEMA_FILE.read_text(encoding="utf-8")
    if original.startswith("-- schema.sql (gerado automaticamente)"):
        return
    header = "\n".join(
        [
            "-- =============================================================================",
            "-- schema.sql (gerado automaticamente)",
            f"-- Gerado em: {generated_at}",
            f"-- Fonte: {from_source}",
            "-- Regenerar: python supabase/generate_schema.py",
            "-- =============================================================================",
            "",
        ]
    )
    SCHEMA_FILE.write_text(header + original, encoding="utf-8", newline="\n")


def write_schema_from_migrations() -> None:
    SCHEMA_FILE.parent.mkdir(parents=True, exist_ok=True)
    SCHEMA_FILE.write_text(build_schema_from_migrations(), encoding="utf-8", newline="\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Gera supabase/schema.sql")
    parser.add_argument(
        "--from-migrations",
        action="store_true",
        help="Forca geracao concatenando migrations (sem conectar ao banco)",
    )
    args = parser.parse_args()

    load_dotenv()

    if not args.from_migrations:
        db_url = resolve_db_url()
        if db_url:
            try:
                dump_schema_from_database(db_url)
                print(f"OK - schema.sql gerado via dump remoto: {SCHEMA_FILE}")
                return 0
            except (subprocess.CalledProcessError, FileNotFoundError) as exc:
                detail = getattr(exc, "stderr", "") or str(exc)
                if db_url:
                    detail = detail.replace(db_url, "<DATABASE_URL>")
                print(
                    f"AVISO - dump remoto falhou ({detail.strip()}); usando migrations locais.",
                    file=sys.stderr,
                )

    write_schema_from_migrations()
    print(f"OK - schema.sql gerado a partir das migrations: {SCHEMA_FILE}")
    print(f"     migrations: {len(migration_files())} arquivos")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
