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
| `npm run test:coverage` | Relatório de cobertura (`lib/` e `components/`) |
| `npx tsc --noEmit` | Checagem de tipos (roda no CI) |

## Adicionar uma nova página

1. Crie `app/(dashboard)/nova-rota/page.tsx`.
2. Use o boilerplate padrão:

```tsx
import { SetupBanner } from "@/components/dashboard/SetupBanner";
import { PageHeader } from "@/components/layout/PageHeader";
import { type DashboardPageProps, getDashboardContext } from "@/lib/dashboard/page";

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
4. Adicione `app/(dashboard)/nova-rota/loading.tsx` reutilizando `DashboardPageLoading`.
5. Adicione testes se houver lógica nova em `lib/`.

## Renderização e performance

Padrões adotados para reduzir tempo até conteúdo visível (detalhes em [02-arquitetura.md](./02-arquitetura.md)):

### Cache de fetchers

Dados que só mudam após sync do pipeline devem usar `cachedFetch` em `lib/dashboard/cache.ts`:

```typescript
export const fetchMinhaMetrica = cachedFetch(
  "minha-metrica",
  async (filters: DashboardFilters) => {
    // usar createStaticSupabase() — nunca cookies dentro do cache
  },
);
```

A invalidação é automática via `POST /api/revalidate` após sync (tag `kpis`).

### Layout não bloqueante

O layout do dashboard **não** deve ter `await` no topo. Busque dados dentro de wrappers async em `DashboardLayoutParts.tsx` e envolva cada um em `<Suspense>`.

### Streaming em páginas com muitos cards

Para páginas com vários fetches independentes, extraia seções async (padrão da Executivo em `components/dashboard/executivo/`):

```tsx
<Suspense fallback={<KpiGridSkeleton />}>
  <KpiSection filters={filters} />
</Suspense>
```

Replique este padrão em outras páginas (Alertas, Sprint, etc.) se o ganho percebido justificar.

### Skeleton de navegação

Toda rota principal deve ter `loading.tsx`:

```tsx
import { DashboardPageLoading } from "@/components/layout/DashboardPageLoading";

export default function Loading() {
  return <DashboardPageLoading />;
}
```

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
| Páginas dashboard | dinâmicas via `searchParams` e/ou auth com cookies (`/parcerias` usa `force-dynamic`) |
| Fetchers de KPI | `cachedFetch` + `createStaticSupabase()` |
| Layout dashboard | síncrono; fetches em wrappers async com `Suspense` |
| Novas rotas | incluir `loading.tsx` com `DashboardPageLoading` |
| Client components | apenas quando necessário (hooks, Recharts interativo) |

## Testes

Testes em `tests/` com Vitest + jsdom + Testing Library.

Áreas cobertas (exemplos):

- `parseFilters`, `sortFilterOptions`, `sortSprintOptions`
- formatação pt-BR
- navegação (`isNavItemActive`)
- componentes KPI, filtros e tooltips
- relatório de fluxo (`flow-stages`, `flow-report`, `flow-charts`)
- importação Planning Poker (`planning-poker-import`)
- parcerias (`parcerias`, `parcerias-export`)
- issues export e drill-down links

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
2. ESLint (`npm run lint`)
3. Type check (`npx tsc --noEmit`)
4. Unit tests com cobertura (`npm run test:coverage`) — artefato `coverage-report`
5. Auditoria de dependências (`npm audit --audit-level=high`)

Badge no README aponta para este workflow. Guia de contribuição: [CONTRIBUTING.md](../CONTRIBUTING.md).

**SonarCloud:** análise automática em [sonarcloud.io](https://sonarcloud.io/project/overview?id=MariaHilmar_mgi-kpi-dashboard) (`.sonarcloud.properties`).

**Dependabot:** `.github/dependabot.yml` — atualizações semanais de npm e GitHub Actions.

## Tooltips de seção

Para adicionar explicações em títulos de gráficos/KPIs:

1. Adicione o texto em `lib/dashboard/<pagina>-section-tooltips.ts`.
2. Passe `tooltip={...}` para `CardSectionHeader`, `KpiCard`, `BarChartCard`, etc.
3. Use `PageHeader` com `titleTooltip` no cabeçalho da página.

Componente base: `components/ui/InfoTooltip.tsx`.

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
| `components/dashboard/executivo/` | Seções async com streaming (página Executivo) |
| `components/dashboard/fluxo/` | Relatório Kanban |
| `components/dados/` | Importação Planning Poker |
| `components/issues/` | Listagem paginada |
| `components/parcerias/` | Relatório de parcerias |
| `components/layout/` | Shell GovBR, navegação, filtros, skeletons |
| `components/ui/` | InfoTooltip, Button, SortableTh |

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
