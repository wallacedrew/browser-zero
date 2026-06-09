import { useState } from 'react';
import { activeChipClassForGroupColor, inactiveChipClassForGroupColor } from '../lib/groupColors';
import { ChevronIcon } from './ChevronIcon';

interface NavGroup {
  readonly key: string;
  readonly label: string;
  readonly count: number;
  readonly color: string | null;
}

interface Props {
  groups: ReadonlyArray<NavGroup>;
  activeKey: string | null;
  onSelect: (groupKey: string) => void;
}

// At typical viewport widths ~10 chips fit on one row. 8 is a conservative
// trigger: above this count the chip rail wraps and we offer a toggle so it
// doesn't dominate the sticky header. Below it, every chip already fits on
// row 1 and the toggle would be a no-op.
const CHIP_COLLAPSE_THRESHOLD = 8;

// Matches the chip pill height: text-sm line-height + py-1 ≈ 1.75rem.
const COLLAPSED_NAV_CLAMP_CLASS = 'max-h-[1.75rem] overflow-hidden';

export function GroupNav({ groups, activeKey, onSelect }: Props) {
  const [expanded, setExpanded] = useState(false);

  // Nothing to jump between when there's 0 or 1 group; render nothing so
  // the dashboard isn't cluttered with a single-link nav row.
  if (groups.length < 2) return null;

  const showToggle = groups.length > CHIP_COLLAPSE_THRESHOLD;
  const clampClass = showToggle && !expanded ? COLLAPSED_NAV_CLAMP_CLASS : '';

  return (
    <div className="flex items-start gap-2">
      <nav
        aria-label="Jump to group"
        className={`flex flex-wrap gap-2 text-sm flex-1 min-w-0 ${clampClass}`}
      >
        {groups.map((group) => {
          const isActive = group.key === activeKey;
          const chipClass = isActive
            ? activeChipClassForGroupColor(group.color)
            : inactiveChipClassForGroupColor(group.color);
          return (
            <a
              key={group.key}
              href={`#${group.key}`}
              aria-current={isActive ? 'true' : undefined}
              onClick={(event) => {
                event.preventDefault();
                onSelect(group.key);
              }}
              className={`rounded-full px-3 py-1 transition-colors ${chipClass}`}
            >
              {group.label} ({group.count})
            </a>
          );
        })}
      </nav>
      {showToggle && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="inline-flex shrink-0 items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 hover:underline"
        >
          <ChevronIcon collapsed={!expanded} />
          {expanded ? 'Show less' : `Show all (${groups.length})`}
        </button>
      )}
    </div>
  );
}
