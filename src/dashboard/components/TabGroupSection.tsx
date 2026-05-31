import type { TabGroupInfo } from '../../shared/lib/types';
import type { TabGroup } from '../../shared/lib/grouping';
import type { ArmedDeleteState } from '../lib/armedDeleteState';
import type { BulkTabActions } from '../lib/bulkTabActions';
import type { SelectionModel } from '../lib/selectionModel';
import type { DragState } from '../hooks/useDragOverGroupKey';
import type { TabRowViewModel } from '../hooks/useTabViewModels';
import { TabGroupSectionHeader } from './TabGroupSectionHeader';
import { TabGroupSectionTabs } from './TabGroupSectionTabs';

interface Props {
  group: TabGroup<TabRowViewModel>;
  sectionColor: string | null;
  isCollapsed: boolean;
  dragState: DragState;
  allowGrouping: boolean;
  existingGroups: ReadonlyArray<TabGroupInfo>;
  selection: SelectionModel;
  armedDelete: ArmedDeleteState;
  bulkActions: BulkTabActions;
  onToggleCollapsed: () => void;
  onFocus: (tabId: number, windowId: number) => void;
}

export function TabGroupSection({
  group,
  sectionColor,
  isCollapsed,
  dragState,
  allowGrouping,
  existingGroups,
  selection,
  armedDelete,
  bulkActions,
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
      onDragOver={dragState.handlers.onDragOver}
      onDragLeave={dragState.handlers.onDragLeave}
      onDrop={dragState.handlers.onDrop}
      className={`py-3 transition-colors ${dragState.isDragOver ? 'bg-blue-50' : ''}`}
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
        armedDelete={armedDelete}
        isDraggable={dragState.dropEnabled}
        onFocus={onFocus}
      />
    </section>
  );
}
