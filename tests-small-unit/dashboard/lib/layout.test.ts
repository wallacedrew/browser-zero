import { describe, it, expect } from 'vitest';
import { layoutStrategyFor } from '../../../src/dashboard/lib/layout';
import { TabGroupSectionTabs } from '../../../src/dashboard/components/TabGroupSectionTabs';
import { TabGroupSectionCards } from '../../../src/dashboard/components/TabGroupSectionCards';

describe('layoutStrategyFor', () => {
  it('returns the ListLayout for "list"', () => {
    const strategy = layoutStrategyFor('list');
    expect(strategy.key).toBe('list');
    expect(strategy.Body).toBe(TabGroupSectionTabs);
  });

  it('returns the GridLayout for "grid"', () => {
    const strategy = layoutStrategyFor('grid');
    expect(strategy.key).toBe('grid');
    expect(strategy.Body).toBe(TabGroupSectionCards);
  });
});
