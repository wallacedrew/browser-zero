import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TabGroupSectionCards } from '../../../src/dashboard/components/TabGroupSectionCards';
import type { TabRowViewModel } from '../../../src/dashboard/hooks/useTabViewModels';
import { Timestamp } from '../../../src/shared/lib/Timestamp';

const makeViewModel = (overrides: Partial<TabRowViewModel>): TabRowViewModel => ({
  id: 1,
  windowId: 100,
  title: 't',
  url: 'https://example.com',
  domain: 'example.com',
  favIconUrl: null,
  lastAccessed: Timestamp.fromMillis(0),
  group: null,
  lastAccessedLabel: 'just now',
  ...overrides,
});

const noop = () => {
  /* noop */
};

describe('TabGroupSectionCards', () => {
  it('renders one card per tab inside a grid list', () => {
    render(
      <TabGroupSectionCards
        listId="g1"
        hidden={false}
        tabs={[makeViewModel({ id: 1, title: 'one' }), makeViewModel({ id: 2, title: 'two' })]}
        selection={{ selected: new Set(), toggle: noop }}
        armedDelete={{
          armedTabId: null,
          actions: { arm: noop, disarm: vi.fn(), confirm: noop },
        }}
        isDraggable={false}
        onFocus={noop}
      />,
    );

    const list = screen.getByRole('list');
    expect(list).toHaveAttribute('id', 'g1');
    expect(list).not.toHaveAttribute('hidden');
    expect(list.className).toMatch(/grid/);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('one')).toBeInTheDocument();
    expect(screen.getByText('two')).toBeInTheDocument();
  });

  it('hides the list when hidden=true', () => {
    render(
      <TabGroupSectionCards
        listId="g1"
        hidden
        tabs={[makeViewModel({})]}
        selection={{ selected: new Set(), toggle: noop }}
        armedDelete={{
          armedTabId: null,
          actions: { arm: noop, disarm: vi.fn(), confirm: noop },
        }}
        isDraggable={false}
        onFocus={noop}
      />,
    );

    expect(screen.getByRole('list', { hidden: true })).toHaveAttribute('hidden');
  });
});
