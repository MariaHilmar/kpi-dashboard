type Props = {
  title: string;
  subtitle: string;
};

export function ExecutivoSectionHeading({ title, subtitle }: Readonly<Props>) {
  return (
    <header>
      <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
      <p className="mt-1 max-w-3xl text-sm text-slate-600">{subtitle}</p>
    </header>
  );
}
