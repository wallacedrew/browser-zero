import { useState, type DragEvent } from 'react';

export interface DragHandlers {
  onDragOver?: (event: DragEvent<HTMLElement>) => void;
  onDragLeave?: () => void;
  onDrop?: (event: DragEvent<HTMLElement>) => void;
}

export interface DragOverGroupKey {
  readonly dragOverKey: string | null;
  dragHandlersFor(groupKey: string, onDrop: (tabId: number) => void): DragHandlers;
}

interface Options {
  enabled: boolean;
}

export function useDragOverGroupKey({ enabled }: Options): DragOverGroupKey {
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const dragHandlersFor = (groupKey: string, onDrop: (tabId: number) => void): DragHandlers => {
    if (!enabled) return {};
    return {
      onDragOver: (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        if (dragOverKey !== groupKey) setDragOverKey(groupKey);
      },
      onDragLeave: () => {
        if (dragOverKey === groupKey) setDragOverKey(null);
      },
      onDrop: (event) => {
        event.preventDefault();
        setDragOverKey(null);
        const raw = event.dataTransfer.getData('text/plain');
        const tabId = Number(raw);
        if (!Number.isFinite(tabId) || tabId <= 0) return;
        onDrop(tabId);
      },
    };
  };

  return { dragOverKey, dragHandlersFor };
}
