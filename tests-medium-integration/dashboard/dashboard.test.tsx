import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/dashboard/components/App';
import { FakeTabsPort } from './_support/FakeTabsPort';
import type { Tab } from '../../src/shared/lib/types';

const now = new Date(2026, 4, 10, 12).getTime();
const fiveMinAgo = now - 5 * 60_000;
const oneHourAgo = now - 60 * 60_000;

const sampleTabs: readonly Tab[] = [
  {
    id: 1,
    windowId: 100,
    title: 'pull/123',
    url: 'https://github.com/me/repo/pull/123',
    domain: 'github.com',
    intent: 'Dev',
    lastAccessed: fiveMinAgo,
    group: null,
  },
  {
    id: 2,
    windowId: 100,
    title: 'Inbox',
    url: 'https://mail.google.com/mail/u/0',
    domain: 'mail.google.com',
    intent: 'Comms',
    lastAccessed: oneHourAgo,
    group: null,
  },
  {
    id: 3,
    windowId: 200,
    title: 'cats',
    url: 'https://www.youtube.com/watch?v=abc',
    domain: 'youtube.com',
    intent: 'Entertainment',
    lastAccessed: fiveMinAgo,
    group: null,
  },
];

describe('dashboard', () => {
  it('lists every tab grouped by window with title, domain, intent, and relative time', async () => {
    const port = new FakeTabsPort(sampleTabs);

    render(<App tabsPort={port} now={now} />);

    expect(await screen.findByRole('heading', { name: /browser-zero/i })).toBeInTheDocument();

    const window1 = await screen.findByRole('region', { name: /window 1/i });
    const window2 = screen.getByRole('region', { name: /window 2/i });

    expect(within(window1).getByRole('link', { name: 'pull/123' })).toBeInTheDocument();
    expect(within(window1).getByText('github.com')).toBeInTheDocument();
    expect(within(window1).getByText('Dev')).toBeInTheDocument();
    expect(within(window1).getByText('5 min ago')).toBeInTheDocument();

    expect(within(window1).getByRole('link', { name: 'Inbox' })).toBeInTheDocument();
    expect(within(window1).getByText('mail.google.com')).toBeInTheDocument();
    expect(within(window1).getByText('Comms')).toBeInTheDocument();
    expect(within(window1).getByText('1 hr ago')).toBeInTheDocument();

    expect(within(window2).getByRole('link', { name: 'cats' })).toBeInTheDocument();
    expect(within(window2).getByText('youtube.com')).toBeInTheDocument();
    expect(within(window2).getByText('Entertainment')).toBeInTheDocument();
  });

  it('focuses the tab when its title link is clicked', async () => {
    const port = new FakeTabsPort(sampleTabs);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('link', { name: 'pull/123' });

    await user.click(screen.getByRole('link', { name: 'pull/123' }));

    expect(port.focusCalls).toEqual([{ tabId: 1, windowId: 100 }]);
  });

  it('refetches when the Refresh button is clicked', async () => {
    const port = new FakeTabsPort(sampleTabs);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('link', { name: 'pull/123' });

    port.setTabs([
      {
        id: 99,
        windowId: 300,
        title: 'new tab',
        url: 'https://example.com/',
        domain: 'example.com',
        intent: 'Other',
        lastAccessed: now,
        group: null,
      },
    ]);

    await user.click(screen.getByRole('button', { name: /refresh/i }));

    expect(await screen.findByRole('link', { name: 'new tab' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'pull/123' })).not.toBeInTheDocument();
  });

  it('regroups by domain when the user clicks the By domain in url toggle', async () => {
    const port = new FakeTabsPort(sampleTabs);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('region', { name: /window 1/i });

    await user.click(screen.getByRole('radio', { name: /by domain in url/i }));

    const githubGroup = screen.getByRole('region', { name: 'github.com' });
    const mailGroup = screen.getByRole('region', { name: 'mail.google.com' });
    const youtubeGroup = screen.getByRole('region', { name: 'youtube.com' });

    expect(within(githubGroup).getByRole('link', { name: 'pull/123' })).toBeInTheDocument();
    expect(within(mailGroup).getByRole('link', { name: 'Inbox' })).toBeInTheDocument();
    expect(within(youtubeGroup).getByRole('link', { name: 'cats' })).toBeInTheDocument();

    expect(screen.queryByRole('region', { name: /window 1/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /window 2/i })).not.toBeInTheDocument();
  });

  it('closes a tab when its × button is clicked', async () => {
    const port = new FakeTabsPort(sampleTabs);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('link', { name: 'pull/123' });

    await user.click(screen.getByRole('button', { name: 'Close pull/123' }));

    expect(port.closeCalls).toEqual([1]);
    expect(screen.queryByRole('link', { name: 'pull/123' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inbox' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'cats' })).toBeInTheDocument();
  });

  it('regroups by Chrome tab group when the user clicks the By tab group toggle', async () => {
    const groupedSample: readonly Tab[] = [
      {
        id: 10,
        windowId: 100,
        title: 'spec',
        url: 'https://github.com/me/repo/issues/9',
        domain: 'github.com',
        intent: 'Dev',
        lastAccessed: fiveMinAgo,
        group: { id: 1, title: 'Q3 planning', color: 'blue' },
      },
      {
        id: 11,
        windowId: 100,
        title: 'review',
        url: 'https://github.com/me/repo/pull/10',
        domain: 'github.com',
        intent: 'Dev',
        lastAccessed: fiveMinAgo,
        group: { id: 1, title: 'Q3 planning', color: 'blue' },
      },
      {
        id: 12,
        windowId: 100,
        title: 'random',
        url: 'https://example.com/',
        domain: 'example.com',
        intent: 'Other',
        lastAccessed: fiveMinAgo,
        group: null,
      },
    ];
    const port = new FakeTabsPort(groupedSample);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('region', { name: /window 1/i });

    await user.click(screen.getByRole('radio', { name: /by tab group/i }));

    const planningGroup = screen.getByRole('region', { name: 'Q3 planning' });
    const ungroupedGroup = screen.getByRole('region', { name: 'Ungrouped' });

    expect(within(planningGroup).getByRole('link', { name: 'spec' })).toBeInTheDocument();
    expect(within(planningGroup).getByRole('link', { name: 'review' })).toBeInTheDocument();
    expect(within(ungroupedGroup).getByRole('link', { name: 'random' })).toBeInTheDocument();

    // Per-row group chip: the row containing the 'spec' link must also surface
    // the group title 'Q3 planning' (independent of the section header).
    const specRow = within(planningGroup).getByRole('link', { name: 'spec' }).closest('li');
    expect(specRow).not.toBeNull();
    expect(within(specRow as HTMLElement).getByText('Q3 planning')).toBeInTheDocument();

    // Ungrouped tabs render no chip — only the intent badge.
    const randomRow = within(ungroupedGroup).getByRole('link', { name: 'random' }).closest('li');
    expect(randomRow).not.toBeNull();
    expect(within(randomRow as HTMLElement).queryByText('Q3 planning')).not.toBeInTheDocument();

    expect(screen.queryByRole('region', { name: /window 1/i })).not.toBeInTheDocument();
  });
});
