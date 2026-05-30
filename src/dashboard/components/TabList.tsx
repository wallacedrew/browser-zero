import type { Tab, TabGroupInfo } from '../../shared/lib/types';
import {
  groupTabs,
  groupingStrategyFor,
  type DropCallbacks,
  type GroupBy,
} from '../../shared/lib/grouping';
import type { Timestamp } from '../../shared/lib/Timestamp';
import type { BulkTabActions } from '../lib/bulkTabActions';
import { useDragOverGroupKey } from '../hooks/useDragOverGroupKey';
import { useGroupCollapse } from '../hooks/useGroupCollapse';
import { useGroupSectionNavigation } from '../hooks/useGroupSectionNavigation';
import { useTabViewModels } from '../hooks/useTabViewModels';
import { CollapseAllControl } from './CollapseAllControl';
import { GroupNav } from './GroupNav';
import { TabGroupSection } from './TabGroupSection';
import type { ArmedDeleteActions } from './TabRow';

interface Props {
  tabs: readonly Tab[];
  now: Timestamp;
  groupBy: GroupBy;
  selected: ReadonlySet<number>;
  armedDeleteId: number | null;
  existingGroups: ReadonlyArray<TabGroupInfo>;
  onSelectionToggle: (tabId: number) => void;
  onFocus: (tabId: number, windowId: number) => void;
  armedDelete: ArmedDeleteActions;
  bulkActions: BulkTabActions;
  dropCallbacks: DropCallbacks;
}

export function TabList({
  tabs,
  now,
  groupBy,
  selected,
  armedDeleteId,
  existingGroups,
  onSelectionToggle,
  onFocus,
  armedDelete,
  bulkActions,
  dropCallbacks,
}: Props) {
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
  const { dragOverKey, dragHandlersFor } = useDragOverGroupKey({ enabled: dropEnabled });

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
            isDragOver={dragOverKey === group.key}
            dropEnabled={dropEnabled}
            allowGrouping={allowGrouping}
            existingGroups={existingGroups}
            selected={selected}
            armedDeleteId={armedDeleteId}
            dragHandlers={dragHandlersFor(group.key, (tabId) => {
              const referenceTab = group.tabs[0];
              if (!referenceTab) return;
              strategy.dispatchDrop(tabId, referenceTab, dropCallbacks);
            })}
            onToggleCollapsed={() => {
              toggleCollapsed(group.key);
            }}
            armedDelete={armedDelete}
            bulkActions={bulkActions}
            onSelectionToggle={onSelectionToggle}
            onFocus={onFocus}
          />
        ))}
      </div>
    </div>
  );
}
