import type { Tab } from '../../shared/lib/types';
import { IntentBadge } from './IntentBadge';
import { formatRelativeTime } from '../../shared/lib/formatRelativeTime';

interface Props {
  tab: Tab;
  now: number;
  onFocus: (tabId: number, windowId: number) => void;
}

export function TabRow({ tab, now, onFocus }: Props) {
  return (
    <li className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50">
      <IntentBadge intent={tab.intent} />
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
    </li>
  );
}
