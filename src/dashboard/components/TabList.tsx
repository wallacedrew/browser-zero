import type { Tab } from '../../shared/lib/types';
import { TabRow } from './TabRow';

interface Props {
  tabs: readonly Tab[];
  now: number;
  onFocus: (tabId: number, windowId: number) => void;
}

interface WindowGroup {
  windowId: number;
  tabs: readonly Tab[];
}

export function TabList({ tabs, now, onFocus }: Props) {
  const groups = groupByWindow(tabs);

  if (groups.length === 0) {
    return <p className="text-slate-500">No open tabs.</p>;
  }

  return (
    <div className="space-y-6">
      {groups.map((group, index) => (
        <section
          key={group.windowId}
          aria-label={`Window ${String(index + 1)}`}
          className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
        >
          <header className="mb-2 flex items-baseline justify-between px-3">
            <h2 className="text-sm font-semibold text-slate-700">Window {index + 1}</h2>
            <span className="text-xs text-slate-400">
              {group.tabs.length} tab{group.tabs.length === 1 ? '' : 's'}
            </span>
          </header>
          <ul className="divide-y divide-slate-100">
            {group.tabs.map((tab) => (
              <TabRow key={tab.id} tab={tab} now={now} onFocus={onFocus} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function groupByWindow(tabs: readonly Tab[]): WindowGroup[] {
  const byWindow = new Map<number, Tab[]>();
  for (const tab of tabs) {
    const existing = byWindow.get(tab.windowId);
    if (existing) existing.push(tab);
    else byWindow.set(tab.windowId, [tab]);
  }
  return [...byWindow.entries()]
    .sort(([leftWindowId], [rightWindowId]) => leftWindowId - rightWindowId)
    .map(([windowId, windowTabs]) => ({ windowId, tabs: windowTabs }));
}
