import type { TabSummary } from '../hooks/useTabSummary';

interface Props {
  totalCount: number;
  visibleCount: number;
  isFiltering: boolean;
  summary: TabSummary;
}

export function DashboardSubtitle({ totalCount, visibleCount, isFiltering, summary }: Props) {
  const countFragment = isFiltering
    ? `${visibleCount} of ${totalCount} tab${totalCount === 1 ? '' : 's'} match`
    : `${totalCount} tab${totalCount === 1 ? '' : 's'}`;
  const groupedFragment = summary.groupedCount > 0 ? ` · ${summary.groupedCount} in groups` : '';
  const ungroupedFragment =
    summary.ungroupedCount > 0 ? ` · ${summary.ungroupedCount} ungrouped` : '';
  const windowsFragment =
    summary.windowCount > 1 ? ` · all across ${summary.windowCount} windows` : '';

  return (
    <p className="text-base text-slate-500">
      {countFragment}
      {groupedFragment}
      {ungroupedFragment}
      {windowsFragment}
    </p>
  );
}
