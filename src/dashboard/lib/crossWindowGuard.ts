import type { Tab } from '../../shared/lib/types';

export interface CrossWindowAnalysis {
  readonly hostWindowId: number;
  readonly otherWindowCount: number;
  readonly orderedTabIds: readonly number[];
}

export function analyzeForNewGroup(
  tabIds: readonly number[],
  _tabs: readonly Tab[],
): CrossWindowAnalysis | null {
  if (tabIds.length === 0) return null;
  return null;
}
