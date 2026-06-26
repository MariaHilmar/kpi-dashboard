# Desenvolvimento

Guia para contribuir e estender o **mgi-kpi-dashboard**.

## Scripts npm

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Turbopack) |
| `npm run build` | Build de produção |
| `npm run start` | Servidor após build |
| `npm run lint` | ESLint (config Next.js 16) |
| `npm run test` | Vitest — execução única |
| `npm run test:watch` | Vitest em modo watch |
| `npm run test:coverage` | Relatório de cobertura (~87%) |
| `npx tsc --noEmit` | Checagem de tipos (roda no CI) |

## Adicionar uma nova página

1. Crie `app/(dashboard)/nova-rota/page.tsx`.
2. Use o boilerplate padrão:

```tsx
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { type DashboardPageProps, getDashboardContext } from "@/lib/dashboard/page";

export const dynamic = "force-dynamic";

export default async function NovaPage({ searchParams }: DashboardPageProps) {
  const { configured, filters } = await getDashboardContext(searchParams);
  if (!configured) return <SetupBanner />;

  // fetchers com filters...

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="..." subtitle="..." />
      {/* conteúdo */}
    </div>
  );
}
```

3. Registre a rota em `lib/navigation.ts` → `NAV_GROUPS`.
4. Adicione testes se houver lógica nova em `lib/`.

## Adicionar um gráfico com dimensão existente

Se a dimensão já existe em `AGGREGATE_DIMENSIONS`:

```tsx
const data = await fetchAggregate("modulo", filters, { limit: 14 });
return <BarChartCard title="..." data={data} horizontal />;
```

Para dimensões novas, estender a RPC `dashboard_aggregate_v2` na migration Supabase **e** adicionar a dimensão em `lib/dashboard/constants.ts`.

## Adicionar KPI ou métrica

1. Estender RPC `dashboard_kpis_full` (migration SQL).
2. Atualizar tipo `DashboardKpisFull` em `types/database.ts`.
3. Mapear campo em `fetchKpis()` (`lib/dashboard/fetchers.ts`).
4. Exibir em `KpiGrid` ou página específica.

## Filtros

- Defaults: `DEFAULT_FILTERS` em `lib/dashboard/filters.ts`.
- Novo filtro: adicionar em `DashboardFilters`, `parseFilters`, `commonArgs`, componente `GlobalFilters`, view `v_filter_options_full` (SQL) e `_issues_filtered`.

## Convenções de código

| Tópico | Convenção |
|--------|-----------|
| Idioma UI | Português (pt-BR) |
| Formatação numérica | `lib/format.ts` |
| Sentinela sem filtro | `TODOS = "Todos"` |
| Valor ausente em agregação | `NAO_INFORMADO = "Não informado"` |
| Imports | alias `@/` (tsconfig paths) |
| Páginas dashboard | sempre `force-dynamic` |
| Client components | apenas quando necessário (hooks, Recharts interativo) |

## Testes

Testes em `tests/` com Vitest + jsdom + Testing Library.

Áreas cobertas (exemplos):

- `parseFilters`, `sortFilterOptions`, `sortSprintOptions`
- formatação pt-BR
- navegação (`isNavItemActive`)
- componentes KPI e filtros

Executar antes de PR:

```powershell
npx tsc --noEmit
npm run test
npm run lint
```

## CI (GitHub Actions)

Arquivo: `.github/workflows/ci.yml`

Dispara em push/PR para `main`:

1. Node 20 + `npm ci`
2. Type check
3. Unit tests

Badge no README aponta para este workflow.

## Estrutura de tipos

Tipos de domínio centralizados em `types/database.ts`:

- `DashboardFilters`, `DashboardKpisFull`, `ChartPoint`
- `FluxoMensal`, `KpiPorTipo`, `TopLeadTime`
- `AlertaResumo`, `FilterOptions`, `DashboardData`

Evite duplicar shapes inline nos componentes — importe de `types/database.ts`.

## Componentes reutilizáveis

| Pasta | Responsabilidade |
|-------|------------------|
| `components/dashboard/` | Visualizações de dados |
| `components/issues/` | Listagem paginada |
| `components/layout/` | Shell GovBR, navegação, filtros |

Gráficos usam **Recharts** encapsulados em `BarChartCard`, `DonutChartCard`, `FluxoMensalCard`.

## GovBR Design System

Estilos base do GovBR via `@govbr-ds/core`. Header e footer seguem identidade visual gov.br (`GovBrHeader`, `GovBrFooter`).

Tailwind 4 com PostCSS (`postcss.config.mjs`).

## Debugging

### Ver parâmetros RPC

Log temporário em fetchers:

```typescript
console.log("dashboard_kpis_full", commonArgs(filters), dateArgs(filters));
```

### Inspecionar query string

Filtros refletidos na URL — copie a URL completa e reproduza no servidor.

### Supabase local

Opcional: Supabase CLI com banco local para desenvolvimento offline. Migrations em `../supabase/migrations`.

## Relação com documentação do workspace

| Tópico legado | Onde consultar |
|---------------|----------------|
| Pipeline Excel | `docs/README_PIPELINE.md` |
| Estrutura abas Excel | `docs/DIAGNÓSTICO_MÓDULOS_REPOSITÓRIO.md` |
| Módulos MGI | `docs/MÓDULOS_RESUMO_EXECUTIVO.txt` |
| Roadmap BI | `docs/ROADMAP_EXPANSÃO_PIPELINE.md` Fase 3 |

O README na raiz do repo (`mgi-kpi-dashboard/README.md`) é o ponto de entrada rápido; esta pasta `docs/` é a documentação de sistema detalhada.
