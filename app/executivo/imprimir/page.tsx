import { AutoPrint } from "@/components/dashboard/executivo/AutoPrint";
import { fetchExecutivoDataset } from "@/lib/dashboard/executivo-dataset";
import { formatPeriodoLabel } from "@/lib/dashboard/mergeadas-format";
import {
  buildPivotLinhas,
  mergeadasPivotDimensaoLabel,
  parseMergeadasPivotDimensao,
} from "@/lib/dashboard/mergeadas-pivot";
import { parseFilters } from "@/lib/dashboard/filters";
import { type DashboardPageProps } from "@/lib/dashboard/page";
import { recorteResumo } from "@/lib/dashboard/recorte";
import { formatDecimal, formatNumber, formatPercentFixed } from "@/lib/format";
import type { ChartPoint } from "@/types/database";

const PRINT_CSS = `
  @page { size: A4 portrait; margin: 1.2cm; }
  @media print {
    .no-print { display: none !important; }
    /* Repete o cabeçalho da tabela em cada página e não quebra linhas no meio. */
    thead { display: table-header-group; }
    tr { break-inside: avoid; }
    h1, h2 { break-after: avoid; }
  }
  body { background: #fff; }
`;

function SimpleTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <section className="mb-6 break-inside-avoid">
      <h2 className="mb-2 text-base font-semibold">{title}</h2>
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100">
            {headers.map((h) => (
              <th key={h} className="border border-slate-300 px-1.5 py-1 text-left">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {row.map((cell, cidx) => (
                <td
                  key={cidx}
                  className={`border border-slate-300 px-1.5 py-1 ${cidx > 0 ? "text-right" : ""}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function chartRows(data: ChartPoint[]): (string | number)[][] {
  return data.map((r) => [r.label, formatNumber(r.quantidade)]);
}

export default async function ExecutivoImprimirPage({ searchParams }: DashboardPageProps) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const dataset = await fetchExecutivoDataset(filters);
  const k = dataset.kpis;
  const recorte = recorteResumo(filters);
  const periodos = dataset.mergeadas.periodos;
  const dimensao = parseMergeadasPivotDimensao(sp.mergeadasPor);
  const linhaHeader = mergeadasPivotDimensaoLabel(dimensao);
  const pivotLinhas = buildPivotLinhas(dataset.mergeadas.pivots[dimensao], periodos);

  return (
    <main className="mx-auto max-w-[21cm] bg-white p-6 text-slate-900">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <AutoPrint />

      <p className="no-print mb-4 text-right text-sm text-slate-500">
        A caixa de impressão abre automaticamente. Escolha &quot;Salvar como PDF&quot; (tamanho A4).
      </p>

      <header className="mb-5 border-b border-slate-300 pb-3">
        <h1 className="text-xl font-bold">Dashboard Executivo</h1>
        <p className="mt-1 text-xs text-slate-600">
          Gerado em {new Date().toLocaleString("pt-BR")} ·{" "}
          {formatNumber(dataset.mergeadas.totalMergeadas)} mergeadas no recorte
        </p>
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs text-slate-700">
          <dt className="font-semibold">Recorte:</dt>
          <dd>{recorte.periodo}</dd>
          <dt className="font-semibold">Filtros:</dt>
          <dd>{recorte.filtrosTexto}</dd>
        </dl>
      </header>

      {k ? (
        <SimpleTable
          title="KPIs"
          headers={["Indicador", "Valor"]}
          rows={[
            ["Total", formatNumber(k.total)],
            ["Abertas", formatNumber(k.abertas)],
            ["Fechadas", formatNumber(k.fechadas)],
            ["Taxa fechamento", formatPercentFixed(k.taxa_fechamento)],
            ["Lead time médio", formatDecimal(k.lead_time_medio)],
            ["Bugs abertos", formatNumber(k.bugs_abertos)],
            ["Melhorias abertas", formatNumber(k.melhorias_abertas)],
            ["% bugs no backlog", formatPercentFixed(k.pct_bugs_backlog)],
            ["Taxa fech. bug", formatPercentFixed(k.taxa_fech_bug)],
            ["SLA > 90 dias", formatNumber(k.sla_acima_90)],
          ]}
        />
      ) : null}

      <SimpleTable
        title="Evolução mensal"
        headers={["Mês", "Criados", "Fechados", "Backlog", "Mergeadas"]}
        rows={dataset.fluxoMensal.map((r) => [
          r.mes,
          formatNumber(r.criados),
          formatNumber(r.fechados),
          formatNumber(r.backlog_liquido),
          formatNumber(r.mergeadas),
        ])}
      />

      <SimpleTable
        title="Status"
        headers={["Status", "Qtde"]}
        rows={chartRows(dataset.distribuicao.status)}
      />
      <SimpleTable
        title="Tipo"
        headers={["Tipo", "Qtde"]}
        rows={chartRows(dataset.distribuicao.tipo)}
      />
      <SimpleTable
        title="Prioridade"
        headers={["Prioridade", "Qtde"]}
        rows={chartRows(dataset.distribuicao.prioridade)}
      />
      <SimpleTable
        title="Parcerias"
        headers={["Parceria", "Qtde"]}
        rows={chartRows(dataset.detalhamento.parceria)}
      />
      <SimpleTable
        title="Módulos"
        headers={["Módulo", "Qtde"]}
        rows={chartRows(dataset.detalhamento.modulos)}
      />
      <SimpleTable
        title="Área funcional"
        headers={["Área", "Qtde"]}
        rows={chartRows(dataset.detalhamento.areaFuncional)}
      />
      <SimpleTable
        title="Equipes"
        headers={["Equipe", "Qtde"]}
        rows={chartRows(dataset.detalhamento.equipes)}
      />

      <SimpleTable
        title="KPI por tipo"
        headers={["Tipo", "Total", "Abertas", "Fechadas", "Taxa", "Lead méd.", "Lead med."]}
        rows={dataset.detalhamento.kpisPorTipo.map((r) => [
          r.tipo,
          formatNumber(r.total),
          formatNumber(r.abertas),
          formatNumber(r.fechadas),
          formatPercentFixed(r.taxa_fechamento),
          formatDecimal(r.lead_medio),
          formatDecimal(r.lead_mediano),
        ])}
      />

      <SimpleTable
        title="Mergeadas por período (mês do merge)"
        headers={["Período", "Mergeadas"]}
        rows={dataset.mergeadas.porPeriodo.map((r) => [
          formatPeriodoLabel(r.periodo),
          formatNumber(r.total),
        ])}
      />

      <SimpleTable
        title="Mergeadas por épico"
        headers={["Épico", "Mergeadas"]}
        rows={dataset.mergeadas.porEpico.map((r) => [r.epico, formatNumber(r.total)])}
      />

      <SimpleTable
        title={`Mergeadas por ${linhaHeader.toLowerCase()}`}
        headers={[linhaHeader, ...periodos.map(formatPeriodoLabel), "Total"]}
        rows={pivotLinhas.map((l) => [
          l.linha,
          ...periodos.map((p) => formatNumber(l.cols.get(p) ?? 0)),
          formatNumber(l.total),
        ])}
      />
    </main>
  );
}
