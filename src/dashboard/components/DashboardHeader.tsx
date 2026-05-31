import type { GroupBy } from '../../shared/lib/grouping';
import type { TabSummary } from '../hooks/useTabSummary';
import { DashboardSubtitle } from './DashboardSubtitle';
import { ViewToggle } from './ViewToggle';

interface Props {
  totalCount: number;
  visibleCount: number;
  isFiltering: boolean;
  summary: TabSummary;
  groupBy: GroupBy;
  onGroupByChange: (next: GroupBy) => void;
  onRefresh: () => void;
}

export function DashboardHeader({
  totalCount,
  visibleCount,
  isFiltering,
  summary,
  groupBy,
  onGroupByChange,
  onRefresh,
}: Props) {
  return (
    <header className="mb-4 flex items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">browser-zero</h1>
        <DashboardSubtitle
          totalCount={totalCount}
          visibleCount={visibleCount}
          isFiltering={isFiltering}
          summary={summary}
        />
      </div>
      <div className="flex items-center gap-3">
        <ViewToggle value={groupBy} onChange={onGroupByChange} />
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-base font-medium text-white shadow-sm hover:bg-slate-700"
        >
          Refresh
        </button>
      </div>
    </header>
  );
}
