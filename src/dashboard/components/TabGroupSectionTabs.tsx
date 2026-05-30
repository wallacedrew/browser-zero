import type { TabRowViewModel } from '../hooks/useTabViewModels';
import { TabRow, type ArmedDeleteActions } from './TabRow';

interface Props {
  listId: string;
  hidden: boolean;
  tabs: readonly TabRowViewModel[];
  selected: ReadonlySet<number>;
  armedDeleteId: number | null;
  isDraggable: boolean;
  armedDelete: ArmedDeleteActions;
  onSelectionToggle: (tabId: number) => void;
  onFocus: (tabId: number, windowId: number) => void;
}

export function TabGroupSectionTabs({
  listId,
  hidden,
  tabs,
  selected,
  armedDeleteId,
  isDraggable,
  armedDelete,
  onSelectionToggle,
  onFocus,
}: Props) {
  return (
    <ul id={listId} hidden={hidden} className="divide-y divide-slate-100">
      {tabs.map((tab) => (
        <TabRow
          key={tab.id}
          tab={tab}
          lastAccessedLabel={tab.lastAccessedLabel}
          selection={{ isSelected: selected.has(tab.id), toggle: onSelectionToggle }}
          armedForDelete={tab.id === armedDeleteId}
          isDraggable={isDraggable}
          onFocus={onFocus}
          armedDelete={armedDelete}
        />
      ))}
    </ul>
  );
}
