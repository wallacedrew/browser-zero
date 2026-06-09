import type { TabGroupInfo } from '../../shared/lib/types';
import type { DropCallbacks, GroupingStrategy, TabGroup } from '../../shared/lib/grouping';
import type { ArmedDeleteState } from '../lib/armedDeleteState';
import type { BulkTabActions } from '../lib/bulkTabActions';
import type { LayoutStrategy } from '../lib/layout';
import type { SelectionModel } from '../lib/selectionModel';
import { useDragOverGroupKey } from '../hooks/useDragOverGroupKey';
import { useGroupCollapse } from '../hooks/useGroupCollapse';
import type { TabRowViewModel } from '../hooks/useTabViewModels';
import { CollapseAllControl } from './CollapseAllControl';
import { TabGroupSection } from './TabGroupSection';

interface Props {
  groups: readonly TabGroup<TabRowViewModel>[];
  groupKeysList: readonly string[];
  strategy: GroupingStrategy;
  layout: LayoutStrategy;
  selection: SelectionModel;
  armedDelete: ArmedDeleteState;
  existingGroups: ReadonlyArray<TabGroupInfo>;
  onFocus: (tabId: number, windowId: number) => void;
  bulkActions: BulkTabActions;
  dropCallbacks: DropCallbacks;
}

export function TabList({
  groups,
  groupKeysList,
  strategy,
  layout,
  selection,
  armedDelete,
  existingGroups,
  onFocus,
  bulkActions,
  dropCallbacks,
}: Props) {
  const dropEnabled = strategy.dropEnabled;
  const allowGrouping = strategy.allowGrouping;
  const { collapsedKeys, allCollapsed, toggleCollapsed, toggleAllCollapsed } =
    useGroupCollapse(groupKeysList);
  const { dragOverKey, dragHandlersFor } = useDragOverGroupKey({ enabled: dropEnabled });

  if (groups.length === 0) {
    return <p className="text-slate-500">No open tabs.</p>;
  }

  return (
    <div>
      <CollapseAllControl
        visible={groups.length > 1}
        allCollapsed={allCollapsed}
        onToggle={toggleAllCollapsed}
      />
      <div className="divide-y divide-slate-200">
        {groups.map((group) => (
          <TabGroupSection
            key={group.key}
            group={group}
            sectionColor={strategy.sectionColorOf(group.tabs[0])}
            isCollapsed={collapsedKeys.has(group.key)}
            dragState={{
              isDragOver: dragOverKey === group.key,
              dropEnabled,
              handlers: dragHandlersFor(group.key, (tabId) => {
                const referenceTab = group.tabs[0];
                if (!referenceTab) return;
                strategy.dispatchDrop(tabId, referenceTab, dropCallbacks);
              }),
            }}
            allowGrouping={allowGrouping}
            layout={layout}
            existingGroups={existingGroups}
            selection={selection}
            onToggleCollapsed={() => {
              toggleCollapsed(group.key);
            }}
            armedDelete={armedDelete}
            bulkActions={bulkActions}
            onFocus={onFocus}
          />
        ))}
      </div>
    </div>
  );
}
