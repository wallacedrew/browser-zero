import type { DragEvent, ReactNode } from 'react';

interface Props {
  isDraggable: boolean;
  onDragStart: (event: DragEvent<HTMLLIElement>) => void;
  children: ReactNode;
}

export function TabRowContainer({ isDraggable, onDragStart, children }: Props) {
  return (
    <li
      draggable={isDraggable}
      onDragStart={isDraggable ? onDragStart : undefined}
      className={`flex items-center gap-3 px-3 py-2 even:bg-slate-50 hover:bg-slate-100 ${
        isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      {children}
    </li>
  );
}
