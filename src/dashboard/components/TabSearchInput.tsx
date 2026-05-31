interface Props {
  value: string;
  onChange: (next: string) => void;
}

export function TabSearchInput({ value, onChange }: Props) {
  return (
    <input
      type="search"
      aria-label="Filter tabs"
      placeholder="Filter by title, URL, domain, or group…"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mb-4 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-base placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
    />
  );
}
