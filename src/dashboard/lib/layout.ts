import type { ComponentType } from 'react';
import type { ArmedDeleteState } from './armedDeleteState';
import type { SelectionModel } from './selectionModel';
import type { TabRowViewModel } from '../hooks/useTabViewModels';
import { TabGroupSectionCards } from '../components/TabGroupSectionCards';
import { TabGroupSectionTabs } from '../components/TabGroupSectionTabs';

export type LayoutBy = 'list' | 'grid';

export interface TabBodyProps {
  readonly listId: string;
  readonly hidden: boolean;
  readonly tabs: readonly TabRowViewModel[];
  readonly selection: SelectionModel;
  readonly armedDelete: ArmedDeleteState;
  readonly isDraggable: boolean;
  readonly onFocus: (tabId: number, windowId: number) => void;
}

export interface LayoutStrategy {
  readonly key: LayoutBy;
  readonly Body: ComponentType<TabBodyProps>;
}

const ListLayout: LayoutStrategy = {
  key: 'list',
  Body: TabGroupSectionTabs,
};

const GridLayout: LayoutStrategy = {
  key: 'grid',
  Body: TabGroupSectionCards,
};

const STRATEGIES: Record<LayoutBy, LayoutStrategy> = {
  list: ListLayout,
  grid: GridLayout,
};

export function layoutStrategyFor(by: LayoutBy): LayoutStrategy {
  return STRATEGIES[by];
}
