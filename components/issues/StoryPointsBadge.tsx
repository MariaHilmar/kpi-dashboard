type Props = {
  value: number | null | undefined;
  className?: string;
};

export function StoryPointsBadge({ value, className = "" }: Readonly<Props>) {
  if (value == null) {
    return (
      <span
        className={`inline-flex rounded-badge bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ${className}`}
        title="Story points não informados"
      >
        Sem ponto
      </span>
    );
  }

  return (
    <span className={`inline-flex font-medium tabular-nums text-slate-700 ${className}`}>{value}</span>
  );
}
