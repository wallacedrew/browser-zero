interface NavGroup {
  readonly key: string;
  readonly label: string;
  readonly count: number;
}

interface Props {
  groups: ReadonlyArray<NavGroup>;
  onSelect: (groupKey: string) => void;
}

export function GroupNav({ groups, onSelect }: Props) {
  // Nothing to jump between when there's 0 or 1 group; render nothing so
  // the dashboard isn't cluttered with a single-link nav row.
  if (groups.length < 2) return null;

  return (
    <nav aria-label="Jump to group" className="mb-3 flex flex-wrap gap-x-3 gap-y-1 px-3 text-sm">
      {groups.map((group) => (
        <a
          key={group.key}
          href={`#${group.key}`}
          onClick={(event) => {
            event.preventDefault();
            onSelect(group.key);
          }}
          className="text-slate-600 hover:text-slate-900 hover:underline"
        >
          {group.label} ({group.count})
        </a>
      ))}
    </nav>
  );
}
