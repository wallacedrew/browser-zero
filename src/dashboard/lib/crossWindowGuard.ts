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

function pickHostWindow(countsByWindow: ReadonlyMap<number, number>): number {
  let bestWindow = -1;
  let bestCount = -1;
  for (const [windowId, count] of countsByWindow) {
    if (count > bestCount) {
      bestWindow = windowId;
      bestCount = count;
    }
  }
  return bestWindow;
}
