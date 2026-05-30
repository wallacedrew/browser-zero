import type { DragEvent, MouseEvent } from 'react';
import type { Tab } from '../../shared/lib/types';
import { Favicon } from './Favicon';
import { GroupChip } from './GroupChip';
import { TabCloseAction } from './TabCloseAction';
import { TabDomain } from './TabDomain';
import { TabLastAccessedLabel } from './TabLastAccessedLabel';
import { TabRowContainer } from './TabRowContainer';
import { TabSelectCheckbox } from './TabSelectCheckbox';
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
    <TabRowContainer isDraggable={isDraggable} onDragStart={handleDragStart}>
      <Favicon favIconUrl={tab.favIconUrl} />
      <GroupChip group={tab.group} />
      <TabTitleLink tab={tab} onClick={handleTitleClick} />
      <TabDomain domain={tab.domain} />
      <TabLastAccessedLabel label={lastAccessedLabel} />
      <TabSelectCheckbox tabId={tab.id} tabTitle={tab.title} selection={selection} />
      <TabCloseAction
        tabId={tab.id}
        tabTitle={tab.title}
        armed={armedForDelete}
        actions={armedDelete}
      />
    </TabRowContainer>
  );
}
