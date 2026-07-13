export function ImportWhatIsUpdated() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm sm:p-6">
      <h2 className="font-semibold text-slate-900">O que é atualizado?</h2>
      <ul className="mt-3 list-disc space-y-2 pl-4">
        <li>
          Story points e campos de relatório ( aceita, historico_issue, recorrente, horas_estimada,
          horas prevista, justificada, homologado e historico) nas issues já sincronizadas do
          GitLab.
        </li>
        <li>
          Com sprint selecionada, um snapshot da planilha fica disponível para relatórios
          históricos da milestone.
        </li>
        <li>
          Issues que ainda não existem no sistema são ignoradas — sincronize o GitLab antes, se
          necessário.
        </li>
      </ul>
    </section>
  );
}
