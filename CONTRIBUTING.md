# Contribuindo

Obrigado pelo interesse no **MGI KPI Dashboard**. Este guia resume o fluxo para propor mudanças no repositório.

## Antes de começar

1. Leia o [README](README.md) e a documentação em [`docs/`](docs/README.md).
2. Configure o ambiente local (`.env.local` a partir de `.env.local.example`).
3. Use **Node.js 20+** (`engines` em `package.json`).

## Fluxo de trabalho

1. Crie uma branch a partir de `main`:
   - `feat/` — nova funcionalidade
   - `fix/` — correção de bug
   - `chore/` — manutenção, CI, dependências
   - `docs/` — documentação
2. Faça alterações focadas e pequenas (um propósito por PR).
3. Valide localmente antes de abrir o PR:

```powershell
npm ci
npm run lint
npx tsc --noEmit
npm run test
npm run test:coverage   # opcional — relatório em coverage/
```

4. Abra um Pull Request para `main` descrevendo o que mudou e como testar.

## Convenções de código

- **TypeScript** com `strict: true`; evite `any` sem justificativa.
- Reutilize componentes e fetchers existentes em `components/` e `lib/dashboard/`.
- Tipos de domínio em `types/database.ts` — não duplique shapes inline.
- Server Components por padrão; `"use client"` só quando necessário (hooks, interatividade).
- Dados estáveis após sync do pipeline: use `cachedFetch` em `lib/dashboard/cache.ts`.
- Commits em estilo [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.

## Testes

- Framework: **Vitest** + Testing Library (`tests/`).
- Cobertura focada em `lib/` e `components/` (ver `vitest.config.ts`).
- Adicione testes para lógica nova em `lib/`; componentes com comportamento relevante também devem ser testados.

## CI e qualidade

O GitHub Actions (`.github/workflows/ci.yml`) executa em cada PR para `main`:

1. ESLint (`npm run lint`)
2. Type check (`npx tsc --noEmit`)
3. Testes com cobertura (`npm run test:coverage`) — artefato `coverage-report`
4. Auditoria de dependências (`npm audit --audit-level=high`)

**SonarCloud:** análise automática via `.sonarcloud.properties` ([projeto no SonarCloud](https://sonarcloud.io/project/overview?id=MariaHilmar_kpi-dashboard)).

**Dependabot:** atualizações semanais de npm e GitHub Actions (`.github/dependabot.yml`).

**Branches:** após merge de PRs, remova branches remotas obsoletas com `pwsh scripts/prune-merged-remote-branches.ps1` (use `-WhatIf` para simular).

## Segurança

- **Nunca** commite `.env`, `.env.local`, tokens ou chaves `service_role`.
- Use apenas `NEXT_PUBLIC_SUPABASE_ANON_KEY` no frontend.
- Não inclua dados reais de issues, usuários ou dumps de banco no repositório.

Reporte vulnerabilidades conforme [SECURITY.md](SECURITY.md) (não abra issue pública com detalhes exploráveis).

## Documentação

- Atualize o README se mudar setup, rotas ou variáveis de ambiente.
- Detalhes de arquitetura e páginas: pasta `docs/`.
- Screenshots do dashboard: `docs/screenshots/` (atualize ao mudar a UI de forma visível).

## Dúvidas

Abra uma [issue](https://github.com/MariaHilmar/kpi-dashboard/issues) para discutir escopo antes de mudanças grandes.
