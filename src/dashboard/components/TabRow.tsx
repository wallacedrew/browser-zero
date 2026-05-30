import type { DragEvent, MouseEvent } from 'react';
import type { Tab } from '../../shared/lib/types';
import { Favicon } from './Favicon';
import { GroupChip } from './GroupChip';
import { formatRelativeTime } from '../../shared/lib/formatRelativeTime';

interface Props {
  tab: Tab;
  now: number;
  isSelected: boolean;
  armedForDelete: boolean;
  isDraggable: boolean;
  onSelectionToggle: (tabId: number) => void;
  onFocus: (tabId: number, windowId: number) => void;
  onArmDelete: (tabId: number) => void;
  onDisarm: () => void;
  onClose: (tabId: number) => void;
}

export function TabRow({
  tab,
  now,
  isSelected,
  armedForDelete,
  isDraggable,
  onSelectionToggle,
  onFocus,
  onArmDelete,
  onDisarm,
  onClose,
}: Props) {
  const handleDragStart = (event: DragEvent<HTMLLIElement>) => {
    event.dataTransfer.setData('text/plain', String(tab.id));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleTitleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onFocus(tab.id, tab.windowId);
  };

  const handleSelectionChange = () => {
    onSelectionToggle(tab.id);
  };

  const handleConfirmClose = () => {
    onClose(tab.id);
  };

  const handleArmDelete = () => {
    onArmDelete(tab.id);
  };

  return (
    <li
      draggable={isDraggable}
      onDragStart={isDraggable ? handleDragStart : undefined}
      className={`flex items-center gap-3 px-3 py-2 even:bg-slate-50 hover:bg-slate-100 ${
        isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      <Favicon favIconUrl={tab.favIconUrl} />
      {tab.group && <GroupChip group={tab.group} />}
      <a
        href={tab.url}
        draggable={false}
        onClick={handleTitleClick}
        className="min-w-0 flex-1 truncate text-base tracking-tight text-slate-900 hover:underline"
      >
        {tab.title}
      </a>
      <span className="shrink-0 text-sm text-slate-500">{tab.domain}</span>
      <span className="shrink-0 text-sm tabular-nums text-slate-400">
        {formatRelativeTime(tab.lastAccessed, now)}
      </span>
      <input
        type="checkbox"
        aria-label={`Select ${tab.title}`}
        checked={isSelected}
        onChange={handleSelectionChange}
        className="h-5 w-5 shrink-0 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
      />
      {armedForDelete ? (
        <>
          <button
            type="button"
            aria-label={`Confirm close ${tab.title}`}
            data-armed-delete="true"
            onClick={handleConfirmClose}
            className="shrink-0 rounded-full bg-red-600 px-2.5 py-0.5 text-sm font-medium text-white shadow-sm hover:bg-red-700"
          >
            Close?
          </button>
          <button
            type="button"
            aria-label={`Keep ${tab.title}`}
            data-armed-delete="true"
            onClick={onDisarm}
            className="shrink-0 rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Keep
          </button>
        </>
      ) : (
        <button
          type="button"
          aria-label={`Close ${tab.title}`}
          onClick={handleArmDelete}
          className="shrink-0 rounded p-1 text-lg leading-none text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          ×
        </button>
      )}
    </li>
  );
}
