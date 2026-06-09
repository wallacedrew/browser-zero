import type { Tab } from '../../shared/lib/types';

export interface CrossWindowAnalysis {
  readonly hostWindowId: number;
  readonly otherWindowCount: number;
  readonly orderedTabIds: readonly number[];
}

export function analyzeForNewGroup(
  tabIds: readonly number[],
  tabs: readonly Tab[],
): CrossWindowAnalysis | null {
  if (tabIds.length === 0) return null;

  const windowById = new Map<number, number>();
  for (const t of tabs) windowById.set(t.id, t.windowId);

  const knownIds = tabIds.filter((id) => windowById.has(id));
  if (knownIds.length === 0) return null;

  const countsByWindow = new Map<number, number>();
  for (const id of knownIds) {
    const windowId = windowById.get(id) as number;
    countsByWindow.set(windowId, (countsByWindow.get(windowId) ?? 0) + 1);
  }

  const hostWindowId = pickHostWindow(countsByWindow);

  const hostFirst: number[] = [];
  const rest: number[] = [];
  for (const id of knownIds) {
    if (windowById.get(id) === hostWindowId) hostFirst.push(id);
    else rest.push(id);
  }

  return {
    hostWindowId,
    otherWindowCount: countsByWindow.size - 1,
    orderedTabIds: [...hostFirst, ...rest],
  };
}

export function analyzeForExistingGroup(
  tabIds: readonly number[],
  tabs: readonly Tab[],
  groupId: number,
): CrossWindowAnalysis | null {
  if (tabIds.length === 0) return null;

  const hostWindowId = findGroupHostWindow(tabs, groupId);
  if (hostWindowId === null) return null;

  const windowById = new Map<number, number>();
  for (const t of tabs) windowById.set(t.id, t.windowId);

  const knownIds = tabIds.filter((id) => windowById.has(id));
  if (knownIds.length === 0) return null;

  const otherWindows = new Set<number>();
  const hostFirst: number[] = [];
  const rest: number[] = [];
  for (const id of knownIds) {
    const windowId = windowById.get(id) as number;
    if (windowId === hostWindowId) {
      hostFirst.push(id);
    } else {
      rest.push(id);
      otherWindows.add(windowId);
    }
  }

  return {
    hostWindowId,
    otherWindowCount: otherWindows.size,
    orderedTabIds: [...hostFirst, ...rest],
  };
}

function findGroupHostWindow(tabs: readonly Tab[], groupId: number): number | null {
  for (const t of tabs) {
    if (t.group?.id === groupId) return t.windowId;
  }
  return null;
}

function pickHostWindow(countsByWindow: ReadonlyMap<number, number>): number {
  let bestWindow = Number.POSITIVE_INFINITY;
  let bestCount = -1;
  for (const [windowId, count] of countsByWindow) {
    const isHigherCount = count > bestCount;
    const isTiedAndLowerWindowId = count === bestCount && windowId < bestWindow;
    if (isHigherCount || isTiedAndLowerWindowId) {
      bestWindow = windowId;
      bestCount = count;
    }
  }
  return bestWindow;
}
