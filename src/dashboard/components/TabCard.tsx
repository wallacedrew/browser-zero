import type { DragEvent, MouseEvent } from 'react';
import type { Tab } from '../../shared/lib/types';
import type { ArmedDeleteActions, SelectionState } from './TabRow';
import { Favicon } from './Favicon';
import { GroupChip } from './GroupChip';
import { TabCloseAction } from './TabCloseAction';
import { TabDomain } from './TabDomain';
import { TabLastAccessedLabel } from './TabLastAccessedLabel';
import { TabSelectCheckbox } from './TabSelectCheckbox';
import { TabTitleLink } from './TabTitleLink';

interface Props {
  tab: Tab;
  lastAccessedLabel: string;
  selection: SelectionState;
  armedForDelete: boolean;
  isDraggable: boolean;
  onFocus: (tabId: number, windowId: number) => void;
  armedDelete: ArmedDeleteActions;
}

export function TabCard({
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

  const handleCardClick = () => {
    onFocus(tab.id, tab.windowId);
  };

  const handleTitleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onFocus(tab.id, tab.windowId);
  };

  const stopPropagation = (event: MouseEvent) => {
    event.stopPropagation();
  };

  return (
    <li
      draggable={isDraggable}
      onDragStart={isDraggable ? handleDragStart : undefined}
      onClick={handleCardClick}
      className={`flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-3 hover:bg-slate-50 ${
        isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2" onClick={stopPropagation}>
          <TabSelectCheckbox tabId={tab.id} tabTitle={tab.title} selection={selection} />
          <Favicon favIconUrl={tab.favIconUrl} />
          <GroupChip group={tab.group} />
        </div>
        <div className="flex shrink-0 items-center gap-2" onClick={stopPropagation}>
          <TabLastAccessedLabel label={lastAccessedLabel} />
          <TabCloseAction
            tabId={tab.id}
            tabTitle={tab.title}
            armed={armedForDelete}
            actions={armedDelete}
          />
        </div>
      </div>
      <TabTitleLink tab={tab} onClick={handleTitleClick} />
      <TabDomain domain={tab.domain} />
    </li>
  );
}
