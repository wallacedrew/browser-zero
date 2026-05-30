import type { SelectionModel } from '../lib/selectionModel';
import type { TabRowViewModel } from '../hooks/useTabViewModels';
import { TabRow, type ArmedDeleteActions } from './TabRow';

interface Props {
  listId: string;
  hidden: boolean;
  tabs: readonly TabRowViewModel[];
  selection: SelectionModel;
  armedDeleteId: number | null;
  isDraggable: boolean;
  armedDelete: ArmedDeleteActions;
  onFocus: (tabId: number, windowId: number) => void;
}

export function TabGroupSectionTabs({
  listId,
  hidden,
  tabs,
  selection,
  armedDeleteId,
  isDraggable,
  armedDelete,
  onFocus,
}: Props) {
  return (
    <ul id={listId} hidden={hidden} className="divide-y divide-slate-100">
      {tabs.map((tab) => (
        <TabRow
          key={tab.id}
          tab={tab}
          lastAccessedLabel={tab.lastAccessedLabel}
          selection={{ isSelected: selection.selected.has(tab.id), toggle: selection.toggle }}
          armedForDelete={tab.id === armedDeleteId}
          isDraggable={isDraggable}
          onFocus={onFocus}
          armedDelete={armedDelete}
        />
      ))}
    </ul>
  );
}
