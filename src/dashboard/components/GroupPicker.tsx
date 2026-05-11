import { useEffect, useRef, useState } from 'react';
import type { TabGroupInfo } from '../../shared/lib/types';
import { dotClassForGroupColor } from '../lib/groupColors';

interface Props {
  existingGroups: ReadonlyArray<TabGroupInfo>;
  onCreateGroup: (title: string) => void;
  onAssignToExisting: (groupId: number) => void;
  onClose: () => void;
}

export function GroupPicker({ existingGroups, onCreateGroup, onAssignToExisting, onClose }: Props) {
  const [name, setName] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close on click outside the menu OR Escape.
  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && containerRef.current?.contains(target)) return;
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      role="menu"
      aria-label="Add to group menu"
      className="absolute right-0 z-20 mt-1 w-64 rounded-md border border-slate-200 bg-white p-2 text-sm shadow-lg"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onCreateGroup(name.trim());
        }}
      >
        <input
          type="text"
          aria-label="Name new group"
          placeholder="+ New group…"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
          autoFocus
          className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-sm placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
      </form>
      {existingGroups.length > 0 && (
        <>
          <hr className="my-2 border-slate-200" />
          <ul className="max-h-64 overflow-y-auto">
            {existingGroups.map((group) => (
              <li key={group.id}>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onAssignToExisting(group.id);
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClassForGroupColor(group.color)}`}
                    aria-hidden="true"
                  />
                  <span className="truncate">
                    {group.title.length > 0 ? group.title : 'Untitled'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
