import type { ArmedDeleteState } from '../lib/armedDeleteState';
import type { SelectionModel } from '../lib/selectionModel';
import type { TabRowViewModel } from '../hooks/useTabViewModels';
import { TabCard } from './TabCard';

interface Props {
  listId: string;
  hidden: boolean;
  tabs: readonly TabRowViewModel[];
  selection: SelectionModel;
  armedDelete: ArmedDeleteState;
  isDraggable: boolean;
  onFocus: (tabId: number, windowId: number) => void;
}

export function TabGroupSectionCards({
  listId,
  hidden,
  tabs,
  selection,
  armedDelete,
  isDraggable,
  onFocus,
}: Props) {
  return (
    <ul
      id={listId}
      hidden={hidden}
      className="grid gap-3 px-3 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]"
    >
      {tabs.map((tab) => (
        <TabCard
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
