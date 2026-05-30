import type { SelectionState } from './TabRow';

interface Props {
  tabId: number;
  tabTitle: string;
  selection: SelectionState;
}

export function TabSelectCheckbox({ tabId, tabTitle, selection }: Props) {
  return (
    <input
      type="checkbox"
      aria-label={`Select ${tabTitle}`}
      checked={selection.isSelected}
      onChange={() => selection.toggle(tabId)}
      className="h-5 w-5 shrink-0 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
    />
  );
}
