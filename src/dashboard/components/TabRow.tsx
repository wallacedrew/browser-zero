import type { DragEvent, MouseEvent } from 'react';
import type { Tab } from '../../shared/lib/types';
import { Favicon } from './Favicon';
import { GroupChip } from './GroupChip';
import { TabCloseAction } from './TabCloseAction';
import { TabDomain } from './TabDomain';
import { TabLastAccessedLabel } from './TabLastAccessedLabel';
import { TabTitleLink } from './TabTitleLink';

export interface ArmedDeleteActions {
  arm: (tabId: number) => void;
  disarm: () => void;
  confirm: (tabId: number) => void;
}

export interface SelectionState {
  isSelected: boolean;
  toggle: (tabId: number) => void;
}

interface Props {
  tab: Tab;
  lastAccessedLabel: string;
  selection: SelectionState;
  armedForDelete: boolean;
  isDraggable: boolean;
  onFocus: (tabId: number, windowId: number) => void;
  armedDelete: ArmedDeleteActions;
}

export function TabRow({
  tab,
  lastAccessedLabel,
  selection,
  armedForDelete,
  isDraggable,
  onFocus,
  armedDelete,
}: Props) {
  const handleDragStart = (event: DragEvent<HTMLLIElement>) => {
    event.dataTransfer.setData('text/plain', String(tab.id));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleTitleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onFocus(tab.id, tab.windowId);
  };

  return (
    <li
      draggable={isDraggable}
      onDragStart={isDraggable ? handleDragStart : undefined}
      className={`flex items-center gap-3 px-3 py-2 even:bg-slate-50 hover:bg-slate-100 ${
        isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      <Favicon favIconUrl={tab.favIconUrl} />
      {tab.group && <GroupChip group={tab.group} />}
      <TabTitleLink tab={tab} onClick={handleTitleClick} />
      <TabDomain domain={tab.domain} />
      <TabLastAccessedLabel label={lastAccessedLabel} />
      <input
        type="checkbox"
        aria-label={`Select ${tab.title}`}
        checked={selection.isSelected}
        onChange={() => selection.toggle(tab.id)}
        className="h-5 w-5 shrink-0 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
      />
      <TabCloseAction
        tabId={tab.id}
        tabTitle={tab.title}
        armed={armedForDelete}
        actions={armedDelete}
      />
    </li>
  );
}
