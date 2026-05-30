import type { TabGroupInfo } from '../../shared/lib/types';
import type { TabGroup } from '../../shared/lib/grouping';
import type { DragHandlers } from '../hooks/useDragOverGroupKey';
import type { TabRowViewModel } from '../hooks/useTabViewModels';
import type { ArmedDeleteActions } from './TabRow';
import { TabGroupSectionHeader } from './TabGroupSectionHeader';
import { TabGroupSectionTabs } from './TabGroupSectionTabs';

interface Props {
  group: TabGroup<TabRowViewModel>;
  sectionColor: string | null;
  isCollapsed: boolean;
  isDragOver: boolean;
  dropEnabled: boolean;
  allowGrouping: boolean;
  existingGroups: ReadonlyArray<TabGroupInfo>;
  selected: ReadonlySet<number>;
  armedDeleteId: number | null;
  armedDelete: ArmedDeleteActions;
  dragHandlers: DragHandlers;
  onToggleCollapsed: () => void;
  onSelectionToggle: (tabId: number) => void;
  onSelectGroup: (tabIds: readonly number[]) => void;
  onClearGroup: (tabIds: readonly number[]) => void;
  onDeleteIds: (tabIds: readonly number[]) => void;
  onFocus: (tabId: number, windowId: number) => void;
  onCreateGroup: (tabIds: readonly number[], title: string) => void;
  onAssignManyToGroup: (tabIds: readonly number[], groupId: number) => void;
}

export function TabGroupSection({
  group,
  sectionColor,
  isCollapsed,
  isDragOver,
  dropEnabled,
  allowGrouping,
  existingGroups,
  selected,
  armedDeleteId,
  armedDelete,
  dragHandlers,
  onToggleCollapsed,
  onSelectionToggle,
  onSelectGroup,
  onClearGroup,
  onDeleteIds,
  onFocus,
  onCreateGroup,
  onAssignManyToGroup,
}: Props) {
  const groupIds = group.tabs.map((tab) => tab.id);
  const selectedIdsInGroup = group.tabs.flatMap((tab) => (selected.has(tab.id) ? [tab.id] : []));
  const listId = `group-list-${group.key}`;

  return (
    <section
      data-group-key={group.key}
      aria-label={group.label}
      onDragOver={dragHandlers.onDragOver}
      onDragLeave={dragHandlers.onDragLeave}
      onDrop={dragHandlers.onDrop}
      className={`py-3 transition-colors ${isDragOver ? 'bg-blue-50' : ''}`}
    >
      <TabGroupSectionHeader
        label={group.label}
        tabCount={group.tabs.length}
        groupIds={groupIds}
        selectedIds={selectedIdsInGroup}
        listId={listId}
        sectionColor={sectionColor}
        collapsed={isCollapsed}
        allowGrouping={allowGrouping}
        existingGroups={existingGroups}
        onToggleCollapsed={onToggleCollapsed}
        onSelectGroup={onSelectGroup}
        onClearGroup={onClearGroup}
        onDeleteIds={onDeleteIds}
        onCreateGroup={onCreateGroup}
        onAssignManyToGroup={onAssignManyToGroup}
      />
      <TabGroupSectionTabs
        listId={listId}
        hidden={isCollapsed}
        tabs={group.tabs}
        selected={selected}
        armedDeleteId={armedDeleteId}
        isDraggable={dropEnabled}
        armedDelete={armedDelete}
        onSelectionToggle={onSelectionToggle}
        onFocus={onFocus}
      />
    </section>
  );
}
