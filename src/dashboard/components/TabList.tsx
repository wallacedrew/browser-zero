import type { Tab } from '../../shared/lib/types';
import { groupTabs, type GroupBy } from '../../shared/lib/grouping';
import { TabRow } from './TabRow';

interface Props {
  tabs: readonly Tab[];
  now: number;
  groupBy: GroupBy;
  selected: ReadonlySet<number>;
  armedDeleteId: number | null;
  onSelectionToggle: (tabId: number) => void;
  onSelectGroup: (tabIds: readonly number[]) => void;
  onClearGroup: (tabIds: readonly number[]) => void;
  onDeleteIds: (tabIds: readonly number[]) => void;
  onFocus: (tabId: number, windowId: number) => void;
  onArmDelete: (tabId: number) => void;
  onDisarm: () => void;
  onClose: (tabId: number) => void;
}

export function TabList({
  tabs,
  now,
  groupBy,
  selected,
  armedDeleteId,
  onSelectionToggle,
  onSelectGroup,
  onClearGroup,
  onDeleteIds,
  onFocus,
  onArmDelete,
  onDisarm,
  onClose,
}: Props) {
  const groups = groupTabs(tabs, groupBy);

  if (groups.length === 0) {
    return <p className="text-slate-500">No open tabs.</p>;
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const groupIds = group.tabs.map((tab) => tab.id);
        const selectedIdsInGroup = group.tabs.flatMap((tab) =>
          selected.has(tab.id) ? [tab.id] : [],
        );
        const selectedInGroup = selectedIdsInGroup.length;
        const hasUnselected = selectedInGroup < group.tabs.length;
        const hasAnySelected = selectedInGroup > 0;

        return (
          <section
            key={group.key}
            aria-label={group.label}
            className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
          >
            <header className="mb-2 space-y-1 px-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-sm font-semibold text-slate-700">{group.label}</h2>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>
                    {group.tabs.length} tab{group.tabs.length === 1 ? '' : 's'}
                  </span>
                  {hasUnselected && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectGroup(groupIds);
                      }}
                      className="text-slate-600 hover:text-slate-900 hover:underline"
                    >
                      Select all
                    </button>
                  )}
                  {hasAnySelected && (
                    <button
                      type="button"
                      onClick={() => {
                        onClearGroup(groupIds);
                      }}
                      className="text-slate-600 hover:text-slate-900 hover:underline"
                    >
                      Keep all
                    </button>
                  )}
                </div>
              </div>
              {hasAnySelected && (
                <div
                  role="region"
                  aria-label={`${group.label} selection actions`}
                  className="flex flex-wrap items-center justify-end gap-3 text-xs"
                >
                  <span className="font-medium text-slate-700">
                    {selectedInGroup} tab{selectedInGroup === 1 ? '' : 's'} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteIds(selectedIdsInGroup);
                    }}
                    className="rounded-md bg-red-600 px-2.5 py-0.5 text-xs font-medium text-white shadow-sm hover:bg-red-700"
                  >
                    Close?
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClearGroup(groupIds);
                    }}
                    className="text-slate-500 hover:text-slate-700 hover:underline"
                  >
                    Keep
                  </button>
                </div>
              )}
            </header>
            <ul className="divide-y divide-slate-100">
              {group.tabs.map((tab) => (
                <TabRow
                  key={tab.id}
                  tab={tab}
                  now={now}
                  isSelected={selected.has(tab.id)}
                  armedForDelete={tab.id === armedDeleteId}
                  onSelectionToggle={onSelectionToggle}
                  onFocus={onFocus}
                  onArmDelete={onArmDelete}
                  onDisarm={onDisarm}
                  onClose={onClose}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
