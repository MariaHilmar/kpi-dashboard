# Supabase — schema e migrations

## Estrutura

| Caminho | Descricao |
|---------|-----------|
| `migrations/` | Migrations versionadas (`NNN_descricao.sql`) — fonte de verdade para evolucao |
| `schema.sql` | **Snapshot gerado** do schema completo (nao editar manualmente) |
| `generate_schema.py` | Script de regeneracao do `schema.sql` |
| `generate_schema.ps1` | Atalho PowerShell |

## Regra obrigatoria

**Sempre que criar ou alterar uma migration**, regenere o snapshot:

```powershell
cd seu-workspace
python supabase/generate_schema.py
```

Ou:

```powershell
.\supabase\generate_schema.ps1
```

Inclua `schema.sql` no mesmo commit da migration.

## Como o schema e gerado

1. **Preferencial:** `supabase db dump` usando `DATABASE_URL` (ou `SUPABASE_DB_URL` /
   `DIRECT_URL`) definido em `mgi-workspace/.env`.
2. **Fallback:** concatenacao ordenada de `migrations/*.sql` quando o dump remoto
   nao estiver disponivel.

Para forcar apenas migrations locais:

```powershell
python supabase/generate_schema.py --from-migrations
```

## Aplicar migrations no projeto Supabase

SQL Editor ou:

```bash
supabase db push --workdir supabase
```

(requer projeto linkado e `config.toml` configurado)
