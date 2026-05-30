import type { Tab } from '../../shared/lib/types';
import { TabRow } from './TabRow';

type TabRowViewModel = Tab & { readonly lastAccessedLabel: string };

interface Props {
  listId: string;
  hidden: boolean;
  tabs: readonly TabRowViewModel[];
  selected: ReadonlySet<number>;
  armedDeleteId: number | null;
  isDraggable: boolean;
  onSelectionToggle: (tabId: number) => void;
  onFocus: (tabId: number, windowId: number) => void;
  onArmDelete: (tabId: number) => void;
  onDisarm: () => void;
  onClose: (tabId: number) => void;
}

export function TabGroupSectionTabs({
  listId,
  hidden,
  tabs,
  selected,
  armedDeleteId,
  isDraggable,
  onSelectionToggle,
  onFocus,
  onArmDelete,
  onDisarm,
  onClose,
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
          armedDelete={{ arm: onArmDelete, disarm: onDisarm, confirm: onClose }}
        />
      ))}
    </ul>
  );
}
