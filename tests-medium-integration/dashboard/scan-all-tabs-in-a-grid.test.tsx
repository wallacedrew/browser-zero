import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/dashboard/components/App';
import { FakeTabsPort } from './_support/FakeTabsPort';
import type { Tab } from '../../src/shared/lib/types';
import { Timestamp } from '../../src/shared/lib/Timestamp';

const nowMillis = new Date(2026, 4, 10, 12).getTime();
const now = Timestamp.fromMillis(nowMillis);
const fiveMinAgo = Timestamp.fromMillis(nowMillis - 5 * 60_000);
const oneHourAgo = Timestamp.fromMillis(nowMillis - 60 * 60_000);
const twoHoursAgo = Timestamp.fromMillis(nowMillis - 2 * 60 * 60_000);

const sampleTabs: readonly Tab[] = [
  {
    id: 1,
    windowId: 100,
    title: 'pull/123',
    url: 'https://github.com/me/repo/pull/123',
    domain: 'github.com',
    favIconUrl: null,
    lastAccessed: oneHourAgo,
    group: null,
  },
  {
    id: 2,
    windowId: 100,
    title: 'Inbox',
    url: 'https://mail.google.com/mail/u/0',
    domain: 'mail.google.com',
    favIconUrl: null,
    lastAccessed: fiveMinAgo,
    group: null,
  },
  {
    id: 3,
    windowId: 200,
    title: 'cats',
    url: 'https://www.youtube.com/watch?v=abc',
    domain: 'youtube.com',
    favIconUrl: null,
    lastAccessed: twoHoursAgo,
    group: null,
  },
];

describe('scan all tabs in a grid', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it.skip('scans all open tabs as cards sorted by recency, focuses on click, closes, and bulk-groups', async () => {
    const port = new FakeTabsPort(sampleTabs);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('link', { name: 'Inbox' });

    // Switch grouping to Flat then layout to Grid.
    await user.click(screen.getByRole('radio', { name: /^flat$/i }));
    await user.click(screen.getByRole('radio', { name: /^grid$/i }));

    // One section labeled "All tabs".
    const section = await screen.findByRole('region', { name: /all tabs/i });
    expect(within(section).getByText(/3 tabs/i)).toBeInTheDocument();

    // Cards rendered in last-accessed desc order: Inbox (5m), pull/123 (1h), cats (2h).
    const cards = within(section).getAllByRole('listitem');
    expect(cards).toHaveLength(3);
    expect(within(cards[0]!).getByText('Inbox')).toBeInTheDocument();
    expect(within(cards[1]!).getByText('pull/123')).toBeInTheDocument();
    expect(within(cards[2]!).getByText('cats')).toBeInTheDocument();

    // Click anywhere on the first card body → focuses that tab.
    await user.click(cards[0]!);
    expect(port.focusCalls).toContainEqual({ tabId: 2, windowId: 100 });

    // Close the second card (× → confirm) → calls closeMany.
    await user.click(within(cards[1]!).getByRole('button', { name: 'Close pull/123' }));
    await user.click(within(cards[1]!).getByRole('button', { name: 'Confirm close pull/123' }));
    expect(port.closeManyCalls).toContainEqual([1]);

    // Select the first and third cards (different windows) and bulk-add to a new group.
    await user.click(within(cards[0]!).getByRole('checkbox', { name: 'Select Inbox' }));
    await user.click(within(cards[2]!).getByRole('checkbox', { name: 'Select cats' }));

    const allTabsActions = screen.getByRole('region', { name: /all tabs selection actions/i });
    await user.click(within(allTabsActions).getByRole('button', { name: /add to group/i }));

    const menu = screen.getByRole('menu', { name: /add to group menu/i });
    await user.type(within(menu).getByRole('textbox', { name: /name new group/i }), 'Reading');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(port.createGroupCalls).toHaveLength(1);
    });
    expect(port.createGroupCalls[0]!.title).toBe('Reading');
    expect([...port.createGroupCalls[0]!.tabIds].sort()).toEqual([2, 3]);
  });
});
