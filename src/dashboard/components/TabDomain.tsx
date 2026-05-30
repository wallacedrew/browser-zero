interface Props {
  domain: string;
}

export function TabDomain({ domain }: Props) {
  return <span className="shrink-0 text-sm text-slate-500">{domain}</span>;
}
