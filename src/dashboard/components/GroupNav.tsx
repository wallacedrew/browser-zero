interface NavGroup {
  readonly key: string;
  readonly label: string;
  readonly count: number;
}

interface Props {
  groups: ReadonlyArray<NavGroup>;
  activeKey: string | null;
  onSelect: (groupKey: string) => void;
}

export function GroupNav({ groups, activeKey, onSelect }: Props) {
  // Nothing to jump between when there's 0 or 1 group; render nothing so
  // the dashboard isn't cluttered with a single-link nav row.
  if (groups.length < 2) return null;

  return (
    <nav
      aria-label="Jump to group"
      className="sticky top-0 z-10 mb-3 flex flex-wrap gap-2 border-b border-slate-200 bg-white/95 px-3 py-2 text-sm backdrop-blur"
    >
      {groups.map((group) => {
        const isActive = group.key === activeKey;
        return (
          <a
            key={group.key}
            href={`#${group.key}`}
            aria-current={isActive ? 'true' : undefined}
            onClick={(event) => {
              event.preventDefault();
              onSelect(group.key);
            }}
            className={`rounded-full px-3 py-1 transition-colors ${
              isActive
                ? 'bg-slate-900 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            {group.label} ({group.count})
          </a>
        );
      })}
    </nav>
  );
}
