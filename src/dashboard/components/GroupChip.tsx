import type { TabGroupInfo } from '../../shared/lib/types';

interface Props {
  group: TabGroupInfo;
}

const DOT_CLASS_BY_COLOR: Record<string, string> = {
  grey: 'bg-slate-400',
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-400',
  green: 'bg-green-500',
  pink: 'bg-pink-500',
  purple: 'bg-purple-500',
  cyan: 'bg-cyan-500',
  orange: 'bg-orange-500',
};

const DEFAULT_DOT_CLASS = 'bg-slate-400';

export function GroupChip({ group }: Props) {
  const dotClass = DOT_CLASS_BY_COLOR[group.color] ?? DEFAULT_DOT_CLASS;
  const label = group.title.length > 0 ? group.title : 'Untitled';
  return (
    <span className="inline-flex max-w-48 shrink-0 items-center gap-1.5 rounded-md bg-slate-50 px-2 py-0.5 text-sm text-slate-700 ring-1 ring-inset ring-slate-200">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} aria-hidden="true" />
      <span className="truncate">{label}</span>
    </span>
  );
}
