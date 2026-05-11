import type { Tab } from '../../shared/lib/types';
import { GroupChip } from './GroupChip';
import { formatRelativeTime } from '../../shared/lib/formatRelativeTime';

interface Props {
  tab: Tab;
  now: number;
  isSelected: boolean;
  armedForDelete: boolean;
  onSelectionToggle: (tabId: number) => void;
  onFocus: (tabId: number, windowId: number) => void;
  onArmDelete: (tabId: number) => void;
  onClose: (tabId: number) => void;
}

export function TabRow({
  tab,
  now,
  isSelected,
  armedForDelete,
  onSelectionToggle,
  onFocus,
  onArmDelete,
  onClose,
}: Props) {
  return (
    <li className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50">
      {tab.group && <GroupChip group={tab.group} />}
      <a
        href={tab.url}
        onClick={(event) => {
          event.preventDefault();
          onFocus(tab.id, tab.windowId);
        }}
        className="min-w-0 flex-1 truncate text-sm text-slate-800 hover:underline"
      >
        {tab.title}
      </a>
      <span className="shrink-0 text-xs text-slate-500">{tab.domain}</span>
      <span className="shrink-0 text-xs tabular-nums text-slate-400">
        {formatRelativeTime(tab.lastAccessed, now)}
      </span>
      <input
        type="checkbox"
        aria-label={`Select ${tab.title}`}
        checked={isSelected}
        onChange={() => {
          onSelectionToggle(tab.id);
        }}
        className="h-4 w-4 shrink-0 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
      />
      {armedForDelete ? (
        <button
          type="button"
          aria-label={`Confirm delete ${tab.title}`}
          data-armed-delete="true"
          onClick={() => {
            onClose(tab.id);
          }}
          className="shrink-0 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-medium text-white shadow-sm hover:bg-red-700"
        >
          Delete?
        </button>
      ) : (
        <button
          type="button"
          aria-label={`Close ${tab.title}`}
          onClick={() => {
            onArmDelete(tab.id);
          }}
          className="shrink-0 rounded p-1 text-base leading-none text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          ×
        </button>
      )}
    </li>
  );
}
