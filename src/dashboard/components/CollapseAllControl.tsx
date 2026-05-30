import { ChevronIcon } from './ChevronIcon';

interface Props {
  visible: boolean;
  allCollapsed: boolean;
  onToggle: () => void;
}

export function CollapseAllControl({ visible, allCollapsed, onToggle }: Props) {
  if (!visible) return null;
  return (
    <div className="mb-2 px-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!allCollapsed}
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 hover:underline"
      >
        <ChevronIcon collapsed={allCollapsed} />
        {allCollapsed ? 'Expand all' : 'Collapse all'}
      </button>
    </div>
  );
}
