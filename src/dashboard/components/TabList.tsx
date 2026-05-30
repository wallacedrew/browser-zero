import { useEffect, useRef, useState, type DragEvent } from 'react';
import type { Tab, TabGroupInfo } from '../../shared/lib/types';
import {
  groupTabs,
  groupingStrategyFor,
  type GroupBy,
  type TabGroup,
} from '../../shared/lib/grouping';
import type { Timestamp } from '../../shared/lib/Timestamp';
import { useGroupCollapse } from '../hooks/useGroupCollapse';
import { useTabViewModels, type TabRowViewModel } from '../hooks/useTabViewModels';
import { CollapseAllControl } from './CollapseAllControl';
import { GroupNav } from './GroupNav';
import { TabGroupSection } from './TabGroupSection';

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
  const containerRef = useRef<HTMLDivElement | null>(null);

  const viewModels = useTabViewModels(tabs, now);
  const strategy = groupingStrategyFor(groupBy);
  const groups = groupTabs(viewModels, groupBy);
  const dropEnabled = strategy.dropEnabled;
  const allowGrouping = strategy.allowGrouping;
  const groupKeys = groups.map((group) => group.key).join('|');
  const { collapsedKeys, allCollapsed, toggleCollapsed, toggleAllCollapsed } = useGroupCollapse(
    groups.map((group) => group.key),
  );

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
        {groups.map((group) => (
          <TabGroupSection
            key={group.key}
            group={group}
            sectionColor={strategy.sectionColorOf(group.tabs[0])}
            isCollapsed={collapsedKeys.has(group.key)}
            isDragOver={dropEnabled && dragOverKey === group.key}
            dropEnabled={dropEnabled}
            allowGrouping={allowGrouping}
            existingGroups={existingGroups}
            selected={selected}
            armedDeleteId={armedDeleteId}
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
            onToggleCollapsed={() => {
              toggleCollapsed(group.key);
            }}
            onSelectionToggle={onSelectionToggle}
            onSelectGroup={onSelectGroup}
            onClearGroup={onClearGroup}
            onDeleteIds={onDeleteIds}
            onFocus={onFocus}
            onArmDelete={onArmDelete}
            onDisarm={onDisarm}
            onClose={onClose}
            onCreateGroup={onCreateGroup}
            onAssignManyToGroup={onAssignManyToGroup}
          />
        ))}
      </div>
    </div>
  );
}
