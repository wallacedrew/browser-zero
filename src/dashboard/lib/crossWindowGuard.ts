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

  const windowIds = new Set(knownIds.map((id) => windowById.get(id) as number));
  const hostWindowId = [...windowIds][0] as number;

  return {
    hostWindowId,
    otherWindowCount: windowIds.size - 1,
    orderedTabIds: knownIds,
  };
}
