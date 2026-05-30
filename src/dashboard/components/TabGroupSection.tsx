import type { DragEvent } from 'react';
import type { TabGroupInfo } from '../../shared/lib/types';
import type { TabGroup } from '../../shared/lib/grouping';
import type { TabRowViewModel } from '../hooks/useTabViewModels';
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
  onDragOver: ((event: DragEvent<HTMLElement>) => void) | undefined;
  onDragLeave: (() => void) | undefined;
  onDrop: ((event: DragEvent<HTMLElement>) => void) | undefined;
  onToggleCollapsed: () => void;
  onSelectionToggle: (tabId: number) => void;
  onSelectGroup: (tabIds: readonly number[]) => void;
  onClearGroup: (tabIds: readonly number[]) => void;
  onDeleteIds: (tabIds: readonly number[]) => void;
  onFocus: (tabId: number, windowId: number) => void;
  onArmDelete: (tabId: number) => void;
  onDisarm: () => void;
  onClose: (tabId: number) => void;
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
  onDragOver,
  onDragLeave,
  onDrop,
  onToggleCollapsed,
  onSelectionToggle,
  onSelectGroup,
  onClearGroup,
  onDeleteIds,
  onFocus,
  onArmDelete,
  onDisarm,
  onClose,
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
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
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
        onSelectionToggle={onSelectionToggle}
        onFocus={onFocus}
        onArmDelete={onArmDelete}
        onDisarm={onDisarm}
        onClose={onClose}
      />
    </section>
  );
}
