import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import type { Tab, TabGroupInfo } from '../../shared/lib/types';
import {
  groupTabs,
  groupingStrategyFor,
  type GroupBy,
  type TabGroup,
} from '../../shared/lib/grouping';
import type { Timestamp } from '../../shared/lib/Timestamp';
import { sectionHeaderClassesForGroupColor } from '../lib/groupColors';
import { ChevronIcon } from './ChevronIcon';
import { CollapseAllControl } from './CollapseAllControl';
import { GroupNav } from './GroupNav';
import { SectionActionPanel } from './SectionActionPanel';
import { TabRow } from './TabRow';

type TabRowViewModel = Tab & { readonly lastAccessedLabel: string };

interface Props {
  tabs: readonly Tab[];
  now: Timestamp;
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
  const [collapsedKeys, setCollapsedKeys] = useState<ReadonlySet<string>>(() => new Set());
  const containerRef = useRef<HTMLDivElement | null>(null);

  const toggleCollapsed = (groupKey: string) => {
    setCollapsedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };
  const viewModels = useMemo<readonly TabRowViewModel[]>(
    () =>
      tabs.map((tab) => ({
        ...tab,
        lastAccessedLabel: tab.lastAccessed.relativeLabelFrom(now),
      })),
    [tabs, now],
  );
  const strategy = groupingStrategyFor(groupBy);
  const groups = groupTabs(viewModels, groupBy);
  const dropEnabled = strategy.dropEnabled;
  const allowGrouping = strategy.allowGrouping;
  const groupKeys = groups.map((group) => group.key).join('|');

  // "All collapsed" is computed against the currently-visible groups, not
  // stale keys from a previous groupBy / search state — so e.g. switching
  // to a brand-new view always reads as "all expanded" from the toggle's
  // perspective even if collapsedKeys still holds keys from the old view.
  const allCollapsed = groups.length > 0 && groups.every((group) => collapsedKeys.has(group.key));
  const toggleAllCollapsed = () => {
    if (allCollapsed) {
      setCollapsedKeys(new Set());
    } else {
      setCollapsedKeys(new Set(groups.map((group) => group.key)));
    }
  };

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
    // Only by-tab-group has an intrinsic color per group (the Chrome tab
    // group color). by-window and by-domain have no inherent group color,
    // so they fall back to the slate default in GroupNav.
    color: strategy.sectionColorOf(group.tabs[0]),
  }));
  // scrollIntoView({ block: 'start' }) lines the section up with the
  // viewport top — directly behind our sticky chip nav, occluding the
  // section header. Measure the sticky nav's actual rendered height
  // (it can be multi-row when there are many chips, e.g. by-domain) and
  // scroll so the section header lands a small gap below the nav.
  const scrollToGroup = (groupKey: string) => {
    const target = containerRef.current?.querySelector<HTMLElement>(
      `[data-group-key="${groupKey}"]`,
    );
    if (!target) return;
    const nav = containerRef.current?.querySelector<HTMLElement>('nav[aria-label="Jump to group"]');
    const navHeight = nav?.offsetHeight ?? 0;
    const breathingRoom = 8;
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: targetTop - navHeight - breathingRoom, behavior: 'smooth' });
    setActiveKey(groupKey);
  };

  const fireDrop = (event: DragEvent<HTMLElement>, group: TabGroup<TabRowViewModel>) => {
    event.preventDefault();
    setDragOverKey(null);
    const raw = event.dataTransfer.getData('text/plain');
    const tabId = Number(raw);
    if (!Number.isFinite(tabId) || tabId <= 0) return;
    const referenceTab = group.tabs[0];
    if (!referenceTab) return;
    strategy.dispatchDrop(tabId, referenceTab, { onDropOnWindow, onDropOnTabGroup });
  };

  return (
    <div ref={containerRef}>
      <GroupNav groups={navGroups} activeKey={resolvedActiveKey} onSelect={scrollToGroup} />
      <CollapseAllControl
        visible={groups.length > 1}
        allCollapsed={allCollapsed}
        onToggle={toggleAllCollapsed}
      />
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
          const sectionColor = strategy.sectionColorOf(group.tabs[0]);
          const headerClasses = sectionHeaderClassesForGroupColor(sectionColor);
          const isCollapsed = collapsedKeys.has(group.key);
          const listId = `group-list-${group.key}`;

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
              <header className="mb-2 space-y-1">
                <div
                  className={`flex items-end justify-between gap-3 border-b-2 px-3 ${headerClasses.shelf}`}
                >
                  <h2 className="-mb-px">
                    <button
                      type="button"
                      onClick={() => {
                        toggleCollapsed(group.key);
                      }}
                      aria-expanded={!isCollapsed}
                      aria-controls={listId}
                      className={`flex items-center gap-2 rounded-t-md border-b-0 px-3 py-1 text-base font-semibold ${headerClasses.tab}`}
                    >
                      <ChevronIcon collapsed={isCollapsed} shrink />
                      <span>{group.label}</span>
                    </button>
                  </h2>
                  <div className="flex items-center gap-3 pb-1 text-sm text-slate-400">
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
                <div className="px-3">
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
                </div>
              </header>
              <ul id={listId} hidden={isCollapsed} className="divide-y divide-slate-100">
                {group.tabs.map((tab) => (
                  <TabRow
                    key={tab.id}
                    tab={tab}
                    lastAccessedLabel={tab.lastAccessedLabel}
                    selection={{ isSelected: selected.has(tab.id), toggle: onSelectionToggle }}
                    armedForDelete={tab.id === armedDeleteId}
                    isDraggable={dropEnabled}
                    onFocus={onFocus}
                    armedDelete={{ arm: onArmDelete, disarm: onDisarm, confirm: onClose }}
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
