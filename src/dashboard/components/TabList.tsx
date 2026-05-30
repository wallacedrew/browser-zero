import { useState, type DragEvent } from 'react';
import type { Tab, TabGroupInfo } from '../../shared/lib/types';
import {
  groupTabs,
  groupingStrategyFor,
  type GroupBy,
  type TabGroup,
} from '../../shared/lib/grouping';
import type { Timestamp } from '../../shared/lib/Timestamp';
import { useGroupCollapse } from '../hooks/useGroupCollapse';
import { useGroupSectionNavigation } from '../hooks/useGroupSectionNavigation';
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

  const viewModels = useTabViewModels(tabs, now);
  const strategy = groupingStrategyFor(groupBy);
  const groups = groupTabs(viewModels, groupBy);
  const dropEnabled = strategy.dropEnabled;
  const allowGrouping = strategy.allowGrouping;
  const groupKeysList = groups.map((group) => group.key);
  const { collapsedKeys, allCollapsed, toggleCollapsed, toggleAllCollapsed } =
    useGroupCollapse(groupKeysList);
  const { containerRef, resolvedActiveKey, scrollToGroup } =
    useGroupSectionNavigation(groupKeysList);

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
