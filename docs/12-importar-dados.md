# Importar Dados — Planning Poker

Rota: **`/importar-dados`** — menu **Dados → Importar Dados**.

Permite atualizar campos de relatório de sprint (story points, aceita, horas, etc.) a partir de planilha Excel/CSV exportada do Planning Poker. **Não cria issues** — cada linha deve corresponder a uma issue já sincronizada do GitLab (`gitlab_repo` + `gitlab_iid`).

## Pré-requisitos

| Item | Detalhe |
|------|---------|
| Sessão ativa | Qualquer usuário logado pode importar |
| `SUPABASE_SERVICE_ROLE_KEY` | Obrigatória no servidor (Vercel env) — escrita via `createAdminSupabase()` |
| Issues existentes | Sync GitLab executado previamente |
| Migrations | `034_milestone_report_schema.sql` e `035_milestone_iid.sql` aplicadas |

Sem a service role, a API retorna **503** com mensagem explicativa.

## Fluxo na UI

1. Baixar template: `GET /api/import/planning-poker/template` (`.xlsx` com cabeçalhos padronizados).
2. Preencher planilha com dados do Planning Poker.
3. (Opcional) Selecionar milestone GitLab pelo **IID da URL** (ex.: `/milestones/90` → `90`).
4. **Validar** (`dryRun=true`) — preview das primeiras linhas e avisos sem gravar.
5. **Importar** — upsert em `issues` e, se milestone informado, em `milestone_issues`.

Componentes: `app/(dashboard)/importar-dados/page.tsx`, `components/dados/ImportarDadosPanel.tsx`.

## API

### `POST /api/import/planning-poker`

| Campo (FormData) | Obrigatório | Descrição |
|------------------|-------------|-----------|
| `file` | Sim | `.xlsx` ou `.csv` (máx. 5 MB) |
| `dryRun` | Não | `"true"` para validação sem gravação |
| `milestoneId` | Não | IID numérico do milestone GitLab |

Resposta de importação (`PlanningPokerImportStats`):

```json
{
  "processed": 42,
  "upserted_issues": 40,
  "not_found_in_issues": 2,
  "upserted_milestone_issues": 40,
  "errors": 0,
  "warnings": ["Linha 5: story_points 4 não é Fibonacci — ignorado."]
}
```

### `GET /api/import/planning-poker/template`

Retorna workbook Excel com cabeçalhos definidos em `TEMPLATE_HEADERS` (`lib/dashboard/planning-poker-import.ts`).

## Colunas da planilha

| Coluna | Obrigatória | Aliases aceitos | Observação |
|--------|-------------|-----------------|------------|
| `gitlab_repo` | Sim | `repositorio`, `repo` | Slug normalizado (ex.: `contratos_v2`) |
| `gitlab_iid` | Sim | `iid`, `id`, `issue_id`, `#` | Número inteiro |
| `sprint` | Não | `milestone` | Nome da sprint |
| `story_points` | Não | `pontos`, `peso`, `weight` | Apenas Fibonacci: 1, 2, 3, 5, 8, 13, 21 |
| `aceita` | Não | — | Sim/Não |
| `historico_issue` | Não | — | Sim/Não (coluna `historico` na base) |
| `recorrente` | Não | — | Sim/Não |
| `horas_estimada` | Não | `horas estimada` | Numérico |
| `horas prevista` | Não | `horas prevista` | Numérico |
| `justificada` | Não | — | Texto |
| `homologado` | Não | `homologado?` | Texto |
| `historico` | Não | — | Último comentário (`ultimo_comentario`) |

A chave de upsert é `issue_key` (`makeIssueKeyFromParts(gitlab_repo, gitlab_iid)`).

## Persistência (Supabase)

Migration **034** cria:

| Tabela | Uso |
|--------|-----|
| `milestones` | Catálogo de milestones do grupo GitLab |
| `milestone_issues` | Snapshot histórico issue × milestone (campos de relatório) |
| `milestone_import_runs` | Auditoria de cada importação |

Colunas adicionadas em `issues` (valor mais recente da importação):

`story_points`, `gitlab_weight`, `aceita`, `justificada`, `historico`, `recorrente`, `horas_estimada`, `horas_prevista`, `homologado`, `ultimo_comentario`, `milestone_gitlab_id`, `report_fields_synced_at`.

Migration **035** adiciona `milestones.gitlab_milestone_iid` (número da URL GitLab).

## Filtros globais

A rota `/importar-dados` **não exibe** a barra de filtros globais (`ConditionalGlobalFilters`).

## Testes

```powershell
npm test -- tests/lib/planning-poker-import.test.ts
```

## Relação com outras funcionalidades

- **Relatório de fluxo (`/fluxo`):** não usa story points (requisito explícito).
- **Parcerias / Analistas:** leem campos de `issues`; importação atualiza metadados de sprint sem alterar labels GitLab.
- **Pipeline Python:** continua sendo a fonte principal de issues; importação complementa campos de relatório manual/planning poker.
