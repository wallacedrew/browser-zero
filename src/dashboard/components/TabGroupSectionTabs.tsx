import type { ArmedDeleteState } from '../lib/armedDeleteState';
import type { SelectionModel } from '../lib/selectionModel';
import type { TabRowViewModel } from '../hooks/useTabViewModels';
import { TabRow } from './TabRow';

interface Props {
  listId: string;
  hidden: boolean;
  tabs: readonly TabRowViewModel[];
  selection: SelectionModel;
  armedDelete: ArmedDeleteState;
  isDraggable: boolean;
  onFocus: (tabId: number, windowId: number) => void;
}

export function TabGroupSectionTabs({
  listId,
  hidden,
  tabs,
  selection,
  armedDelete,
  isDraggable,
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
          armedForDelete={tab.id === armedDelete.armedTabId}
          isDraggable={isDraggable}
          onFocus={onFocus}
          armedDelete={armedDelete.actions}
        />
      ))}
    </ul>
  );
}
