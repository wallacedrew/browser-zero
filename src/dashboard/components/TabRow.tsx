import type { Tab } from '../../shared/lib/types';
import { IntentBadge } from './IntentBadge';
import { GroupChip } from './GroupChip';
import { formatRelativeTime } from '../../shared/lib/formatRelativeTime';

interface Props {
  tab: Tab;
  now: number;
  onFocus: (tabId: number, windowId: number) => void;
  onClose: (tabId: number) => void;
}

export function TabRow({ tab, now, onFocus, onClose }: Props) {
  return (
    <li className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50">
      <IntentBadge intent={tab.intent} />
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
      <button
        type="button"
        aria-label={`Close ${tab.title}`}
        onClick={() => {
          onClose(tab.id);
        }}
        className="shrink-0 rounded p-1 text-base leading-none text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        ×
      </button>
    </li>
  );
}
