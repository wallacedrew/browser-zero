import type { TabGroupInfo } from '../../shared/lib/types';
import { dotClassForGroupColor } from '../lib/groupColors';

interface Props {
  group: TabGroupInfo;
}

export function GroupChip({ group }: Props) {
  const dotClass = dotClassForGroupColor(group.color);
  const label = group.title.length > 0 ? group.title : 'Untitled';
  return (
    <span className="inline-flex max-w-48 shrink-0 items-center gap-1.5 rounded-md bg-slate-50 px-2 py-0.5 text-sm text-slate-700 ring-1 ring-inset ring-slate-200">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} aria-hidden="true" />
      <span className="truncate">{label}</span>
    </span>
  );
}
