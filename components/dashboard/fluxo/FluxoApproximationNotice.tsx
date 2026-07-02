export function FluxoApproximationNotice() {
  return (
    <details className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
      <summary className="cursor-pointer list-none font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true">💡 </span>
        Como ler este relatório
        <span className="ml-2 text-xs font-normal text-sky-700">(clique para expandir)</span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-sky-900">
        O fluxo é reconstruído a partir do histórico de colunas Kanban (
        <code className="text-xs">issue_status_events</code>
        ), complementado por snapshots diários (
        <code className="text-xs">issue_status_snapshots</code>
        ). Resumo por indicador:
      </p>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-sky-900">
        <li>
          <strong>CFD:</strong> Prioridade eventos reais → snapshot diário → proxy (status atual
          entre criação e fechamento). Issues sem histórico no passado podem aparecer paradas
          numa etapa.
        </li>
        <li>
          <strong>Throughput:</strong> Issues concluídas por semana ou mês, com base em{" "}
          <code className="text-xs">fechado_em</code> no período selecionado.
        </li>
        <li>
          <strong>Lead time:</strong> Da criação até a conclusão. A mediana é o KPI principal,
          a referência do aging chart e da distribuição; a média aparece no hint do KPI. O
          gráfico temporal traz média, mediana e P85 por período de conclusão.
        </li>
        <li>
          <strong>WIP:</strong> Volume atual nas etapas A Fazer, Em Desenvolvimento, Em Teste e
          Homologação (Backlog, Concluído e Cancelado ficam de fora).
        </li>
        <li>
          <strong>Idade (aging chart e Top 10):</strong> Conta desde a 1ª entrada em A Fazer ou
          Em Desenvolvimento. Sem eventos no GitLab, usa{" "}
          <code className="text-xs">criado_em</code> como aproximação — por isso issues ainda
          em Backlog podem aparecer entre as mais antigas.
        </li>
        <li>
          <strong>Gargalos:</strong> WIP atual + idade média e máxima por etapa WIP. A heurística
          destaca a etapa com maior retenção estimada no resumo executivo.
        </li>
        <li>
          <strong>Tempo por etapa:</strong> Mediana de dias de permanência por coluna Kanban nas
          issues concluídas no período, reconstruída via{" "}
          <code className="text-xs">issue_status_events</code>. Diferente dos gargalos (snapshot
          atual) e do lead time por módulo em Detalhamento.
        </li>
      </ul>
    </details>
  );
}
