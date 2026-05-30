interface Props {
  label: string;
}

export function TabLastAccessedLabel({ label }: Props) {
  return <span className="shrink-0 text-sm tabular-nums text-slate-400">{label}</span>;
}
