type Props = {
  message?: string;
};

export function SetupBanner({ message }: Props) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
      <p className="font-semibold">Configuração / sync pendente</p>
      <p className="mt-2">
        {message ??
          "Copie web/.env.local.example para web/.env.local e preencha as credenciais do Supabase."}
      </p>
      <ol className="mt-3 list-decimal space-y-1 pl-5">
        <li>Execute as migrations em supabase/migrations/ no SQL Editor do Supabase.</li>
        <li>Configure as variáveis de ambiente em .env e web/.env.local.</li>
        <li>Rode python mgi/sync_supabase.py para carregar a aba Dados.</li>
      </ol>
    </div>
  );
}
