import type { TabGroupInfo } from '../../shared/lib/types';
import type { TabGroup } from '../../shared/lib/grouping';
import type { BulkTabActions } from '../lib/bulkTabActions';
import type { SelectionModel } from '../lib/selectionModel';
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
  selection: SelectionModel;
  armedDeleteId: number | null;
  armedDelete: ArmedDeleteActions;
  bulkActions: BulkTabActions;
  dragHandlers: DragHandlers;
  onToggleCollapsed: () => void;
  onFocus: (tabId: number, windowId: number) => void;
}

export function TabGroupSection({
  group,
  sectionColor,
  isCollapsed,
  isDragOver,
  dropEnabled,
  allowGrouping,
  existingGroups,
  selection,
  armedDeleteId,
  armedDelete,
  bulkActions,
  dragHandlers,
  onToggleCollapsed,
  onFocus,
}: Props) {
  const groupIds = group.tabs.map((tab) => tab.id);
  const selectedIdsInGroup = group.tabs.flatMap((tab) =>
    selection.selected.has(tab.id) ? [tab.id] : [],
  );
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
        bulkActions={bulkActions}
        onToggleCollapsed={onToggleCollapsed}
      />
      <TabGroupSectionTabs
        listId={listId}
        hidden={isCollapsed}
        tabs={group.tabs}
        selection={selection}
        armedDeleteId={armedDeleteId}
        isDraggable={dropEnabled}
        armedDelete={armedDelete}
        onFocus={onFocus}
      />
    </section>
  );
}
