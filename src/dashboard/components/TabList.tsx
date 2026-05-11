import type { Tab } from '../../shared/lib/types';
import { groupTabs, type GroupBy } from '../../shared/lib/grouping';
import { TabRow } from './TabRow';

interface Props {
  tabs: readonly Tab[];
  now: number;
  groupBy: GroupBy;
  selected: ReadonlySet<number>;
  onSelectionToggle: (tabId: number) => void;
  onFocus: (tabId: number, windowId: number) => void;
  onClose: (tabId: number) => void;
}

export function TabList({
  tabs,
  now,
  groupBy,
  selected,
  onSelectionToggle,
  onFocus,
  onClose,
}: Props) {
  const groups = groupTabs(tabs, groupBy);

  if (groups.length === 0) {
    return <p className="text-slate-500">No open tabs.</p>;
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section
          key={group.key}
          aria-label={group.label}
          className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
        >
          <header className="mb-2 flex items-baseline justify-between px-3">
            <h2 className="text-sm font-semibold text-slate-700">{group.label}</h2>
            <span className="text-xs text-slate-400">
              {group.tabs.length} tab{group.tabs.length === 1 ? '' : 's'}
            </span>
          </header>
          <ul className="divide-y divide-slate-100">
            {group.tabs.map((tab) => (
              <TabRow
                key={tab.id}
                tab={tab}
                now={now}
                isSelected={selected.has(tab.id)}
                onSelectionToggle={onSelectionToggle}
                onFocus={onFocus}
                onClose={onClose}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
