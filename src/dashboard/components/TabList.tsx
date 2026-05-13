import { useEffect, useRef, useState, type DragEvent } from 'react';
import type { Tab, TabGroupInfo } from '../../shared/lib/types';
import { groupTabs, type GroupBy, type TabGroup } from '../../shared/lib/grouping';
import { GroupNav } from './GroupNav';
import { SectionActionPanel } from './SectionActionPanel';
import { TabRow } from './TabRow';

interface Props {
  tabs: readonly Tab[];
  now: number;
  groupBy: GroupBy;
  selected: ReadonlySet<number>;
  armedDeleteId: number | null;
  existingGroups: ReadonlyArray<TabGroupInfo>;
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
  onCreateGroup: (tabIds: readonly number[], title: string) => void;
  onAssignManyToGroup: (tabIds: readonly number[], groupId: number) => void;
}

export function TabList({
  tabs,
  now,
  groupBy,
  selected,
  armedDeleteId,
  existingGroups,
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
  onCreateGroup,
  onAssignManyToGroup,
}: Props) {
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const groups = groupTabs(tabs, groupBy);
  const dropEnabled = groupBy === 'window' || groupBy === 'tabgroup';
  const allowGrouping = groupBy !== 'domain';
  const groupKeys = groups.map((group) => group.key).join('|');

  // Default-active the first visible group so the page never loads with
  // zero chips highlighted, and gracefully fall back if a previously-
  // active key disappears (e.g. user filters away that section). Computed
  // every render — cheap, and avoids an extra set-state-in-effect.
  const resolvedActiveKey =
    activeKey && groups.some((group) => group.key === activeKey)
      ? activeKey
      : (groups[0]?.key ?? null);

  // Track which section is currently in the upper portion of the viewport
  // so the sticky GroupNav can highlight its chip. rootMargin shrinks the
  // intersection rect to ~the band just below the sticky nav so the
  // "active" section is the one a reader is actually looking at.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === 'undefined') return;
    const sections = container.querySelectorAll<HTMLElement>('[data-group-key]');
    if (sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (leftEntry, rightEntry) =>
              leftEntry.boundingClientRect.top - rightEntry.boundingClientRect.top,
          );
        const topMost = visible[0];
        if (topMost) {
          const key = topMost.target.getAttribute('data-group-key');
          if (key) setActiveKey(key);
        }
      },
      { rootMargin: '-72px 0px -55% 0px', threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [groupKeys]);

  if (groups.length === 0) {
    return <p className="text-slate-500">No open tabs.</p>;
  }

  const navGroups = groups.map((group) => ({
    key: group.key,
    label: group.label,
    count: group.tabs.length,
  }));
  const scrollToGroup = (groupKey: string) => {
    const target = document.querySelector(`[data-group-key="${groupKey}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveKey(groupKey);
  };

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
    <div ref={containerRef}>
      <GroupNav groups={navGroups} activeKey={resolvedActiveKey} onSelect={scrollToGroup} />
      <div className="divide-y divide-slate-200">
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
              data-group-key={group.key}
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
              className={`py-3 transition-colors ${isDragOver ? 'bg-blue-50' : ''}`}
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
                  allowGrouping={allowGrouping}
                  existingGroups={existingGroups}
                  onClearGroup={onClearGroup}
                  onDeleteIds={onDeleteIds}
                  onCreateGroup={onCreateGroup}
                  onAssignManyToGroup={onAssignManyToGroup}
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
    </div>
  );
}
