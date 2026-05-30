import type { TabGroupInfo } from '../../shared/lib/types';
import type { BulkTabActions } from '../lib/bulkTabActions';
import { sectionHeaderClassesForGroupColor } from '../lib/groupColors';
import { ChevronIcon } from './ChevronIcon';
import { SectionActionPanel } from './SectionActionPanel';

interface Props {
  label: string;
  tabCount: number;
  groupIds: readonly number[];
  selectedIds: readonly number[];
  listId: string;
  sectionColor: string | null;
  collapsed: boolean;
  allowGrouping: boolean;
  existingGroups: ReadonlyArray<TabGroupInfo>;
  bulkActions: BulkTabActions;
  onToggleCollapsed: () => void;
}

export function TabGroupSectionHeader({
  label,
  tabCount,
  groupIds,
  selectedIds,
  listId,
  sectionColor,
  collapsed,
  allowGrouping,
  existingGroups,
  bulkActions,
  onToggleCollapsed,
}: Props) {
  const headerClasses = sectionHeaderClassesForGroupColor(sectionColor);
  const selectedCount = selectedIds.length;
  const hasUnselected = selectedCount < tabCount;
  const hasAnySelected = selectedCount > 0;

  const handleSelectAll = () => {
    bulkActions.select(groupIds);
  };

  const handleClearAll = () => {
    bulkActions.clear(groupIds);
  };

  return (
    <header className="mb-2 space-y-1">
      <div
        className={`flex items-end justify-between gap-3 border-b-2 px-3 ${headerClasses.shelf}`}
      >
        <h2 className="-mb-px">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-expanded={!collapsed}
            aria-controls={listId}
            className={`flex items-center gap-2 rounded-t-md border-b-0 px-3 py-1 text-base font-semibold ${headerClasses.tab}`}
          >
            <ChevronIcon collapsed={collapsed} shrink />
            <span>{label}</span>
          </button>
        </h2>
        <div className="flex items-center gap-3 pb-1 text-sm text-slate-400">
          <span>
            {tabCount} tab{tabCount === 1 ? '' : 's'}
          </span>
          {hasUnselected && (
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-slate-600 hover:text-slate-900 hover:underline"
            >
              Select all
            </button>
          )}
          {hasAnySelected && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-slate-600 hover:text-slate-900 hover:underline"
            >
              Keep all
            </button>
          )}
        </div>
      </div>
      <div className="px-3">
        <SectionActionPanel
          groupLabel={label}
          groupIds={groupIds}
          selectedIds={selectedIds}
          allowGrouping={allowGrouping}
          existingGroups={existingGroups}
          bulkActions={bulkActions}
        />
      </div>
    </header>
  );
}
