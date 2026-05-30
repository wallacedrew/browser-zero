import type { MouseEvent } from 'react';
import type { Tab } from '../../shared/lib/types';

interface Props {
  tab: Tab;
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void;
}

export function TabTitleLink({ tab, onClick }: Props) {
  return (
    <a
      href={tab.url}
      draggable={false}
      onClick={onClick}
      className="min-w-0 flex-1 truncate text-base tracking-tight text-slate-900 hover:underline"
    >
      {tab.title}
    </a>
  );
}
