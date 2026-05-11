import { useState, type DragEvent } from 'react';
import type { Tab } from '../../shared/lib/types';
import { groupTabs, type GroupBy, type TabGroup } from '../../shared/lib/grouping';
import { SectionActionPanel } from './SectionActionPanel';
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
  onDropOnWindow: (tabId: number, targetWindowId: number) => void;
  onDropOnTabGroup: (tabId: number, targetGroupId: number | null) => void;
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
  onDropOnWindow,
  onDropOnTabGroup,
}: Props) {
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const groups = groupTabs(tabs, groupBy);
  const dropEnabled = groupBy === 'window' || groupBy === 'tabgroup';

  if (groups.length === 0) {
    return <p className="text-slate-500">No open tabs.</p>;
  }

  const fireDrop = (event: DragEvent<HTMLElement>, group: TabGroup) => {
    event.preventDefault();
    setDragOverKey(null);
    const raw = event.dataTransfer.getData('text/plain');
    const tabId = Number(raw);
    if (!Number.isFinite(tabId) || tabId <= 0) return;
    const referenceTab = group.tabs[0];
    if (!referenceTab) return;
    if (groupBy === 'window') {
      onDropOnWindow(tabId, referenceTab.windowId);
    } else if (groupBy === 'tabgroup') {
      const targetGroupId = referenceTab.group?.id ?? null;
      onDropOnTabGroup(tabId, targetGroupId);
    }
  };

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
        const isDragOver = dropEnabled && dragOverKey === group.key;

        return (
          <section
            key={group.key}
            aria-label={group.label}
            onDragOver={
              dropEnabled
                ? (event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                    if (dragOverKey !== group.key) setDragOverKey(group.key);
                  }
                : undefined
            }
            onDragLeave={
              dropEnabled
                ? () => {
                    if (dragOverKey === group.key) setDragOverKey(null);
                  }
                : undefined
            }
            onDrop={
              dropEnabled
                ? (event) => {
                    fireDrop(event, group);
                  }
                : undefined
            }
            className={`rounded-lg border bg-white p-3 shadow-sm transition-colors ${
              isDragOver ? 'border-blue-400 ring-2 ring-blue-200' : 'border-slate-200'
            }`}
          >
            <header className="mb-2 space-y-1 px-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-700">{group.label}</h2>
                <div className="flex items-center gap-3 text-sm text-slate-400">
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
              <SectionActionPanel
                groupLabel={group.label}
                groupIds={groupIds}
                selectedIds={selectedIdsInGroup}
                onClearGroup={onClearGroup}
                onDeleteIds={onDeleteIds}
              />
            </header>
            <ul className="divide-y divide-slate-100">
              {group.tabs.map((tab) => (
                <TabRow
                  key={tab.id}
                  tab={tab}
                  now={now}
                  isSelected={selected.has(tab.id)}
                  armedForDelete={tab.id === armedDeleteId}
                  isDraggable={dropEnabled}
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
