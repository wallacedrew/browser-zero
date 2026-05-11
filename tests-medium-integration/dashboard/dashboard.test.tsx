import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * jsdom's DataTransfer is fiddly; this minimal stand-in shares state across
 * dragStart / dragOver / drop synthesised via fireEvent so the React handlers
 * see consistent setData / getData semantics.
 */
const createDataTransfer = () => {
  const store: Record<string, string> = {};
  return {
    setData: (key: string, value: string) => {
      store[key] = value;
    },
    getData: (key: string) => store[key] ?? '',
    dropEffect: 'none' as DataTransfer['dropEffect'],
    effectAllowed: 'all' as DataTransfer['effectAllowed'],
  } as unknown as DataTransfer;
};
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
    lastAccessed: fiveMinAgo,
    group: null,
  },
  {
    id: 2,
    windowId: 100,
    title: 'Inbox',
    url: 'https://mail.google.com/mail/u/0',
    domain: 'mail.google.com',
    lastAccessed: oneHourAgo,
    group: null,
  },
  {
    id: 3,
    windowId: 200,
    title: 'cats',
    url: 'https://www.youtube.com/watch?v=abc',
    domain: 'youtube.com',
    lastAccessed: fiveMinAgo,
    group: null,
  },
];

describe('dashboard', () => {
  beforeEach(() => {
    // window.confirm gates the bulk-delete path; default to "OK" so existing
    // tests that exercise that path don't get blocked. Cancellation is tested
    // explicitly by re-spying inside the relevant test.
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('lists every tab grouped by window with title, domain, and relative time', async () => {
    const port = new FakeTabsPort(sampleTabs);

    render(<App tabsPort={port} now={now} />);

    expect(await screen.findByRole('heading', { name: /browser-zero/i })).toBeInTheDocument();

    const window1 = await screen.findByRole('region', { name: /window 1/i });
    const window2 = screen.getByRole('region', { name: /window 2/i });

    expect(within(window1).getByRole('link', { name: 'pull/123' })).toBeInTheDocument();
    expect(within(window1).getByText('github.com')).toBeInTheDocument();
    expect(within(window1).getByText('5 min ago')).toBeInTheDocument();

    expect(within(window1).getByRole('link', { name: 'Inbox' })).toBeInTheDocument();
    expect(within(window1).getByText('mail.google.com')).toBeInTheDocument();
    expect(within(window1).getByText('1 hr ago')).toBeInTheDocument();

    expect(within(window2).getByRole('link', { name: 'cats' })).toBeInTheDocument();
    expect(within(window2).getByText('youtube.com')).toBeInTheDocument();
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

  it('closes a tab when its × is armed and then clicked a second time', async () => {
    const port = new FakeTabsPort(sampleTabs);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('link', { name: 'pull/123' });

    // First click: arm — × becomes the red "Close?" pill (plus a Keep cancel).
    await user.click(screen.getByRole('button', { name: 'Close pull/123' }));
    expect(screen.getByRole('button', { name: 'Confirm close pull/123' })).toHaveTextContent(
      'Close?',
    );
    expect(screen.getByRole('button', { name: 'Keep pull/123' })).toBeInTheDocument();

    // Second click on the armed pill: actually close.
    await user.click(screen.getByRole('button', { name: 'Confirm close pull/123' }));

    expect(port.closeManyCalls).toEqual([[1]]);
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
        lastAccessed: fiveMinAgo,
        group: { id: 1, title: 'Q3 planning', color: 'blue' },
      },
      {
        id: 11,
        windowId: 100,
        title: 'review',
        url: 'https://github.com/me/repo/pull/10',
        domain: 'github.com',
        lastAccessed: fiveMinAgo,
        group: { id: 1, title: 'Q3 planning', color: 'blue' },
      },
      {
        id: 12,
        windowId: 100,
        title: 'random',
        url: 'https://example.com/',
        domain: 'example.com',
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

  it('filters the list as the user types in the search input', async () => {
    const port = new FakeTabsPort(sampleTabs);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('link', { name: 'pull/123' });

    await user.type(screen.getByRole('searchbox', { name: /filter tabs/i }), 'inbox');

    expect(screen.getByRole('link', { name: 'Inbox' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'pull/123' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'cats' })).not.toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox', { name: /filter tabs/i }));

    expect(screen.getByRole('link', { name: 'pull/123' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inbox' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'cats' })).toBeInTheDocument();
  });

  it("bulk-deletes a section's selected tabs when its Delete button is clicked", async () => {
    const port = new FakeTabsPort(sampleTabs);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('link', { name: 'pull/123' });

    // No section's action panel is visible until a row in that section is checked.
    expect(
      screen.queryByRole('region', { name: /window 1 selection actions/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'Select pull/123' }));
    await user.click(screen.getByRole('checkbox', { name: 'Select Inbox' }));

    const window1Actions = screen.getByRole('region', { name: /window 1 selection actions/i });
    expect(within(window1Actions).getByText(/2 tabs selected/i)).toBeInTheDocument();

    await user.click(within(window1Actions).getByRole('button', { name: 'Close?' }));

    expect(port.closeManyCalls).toEqual([[1, 2]]);
    expect(port.newTabCalls).toBe(0);
    expect(screen.queryByRole('link', { name: 'pull/123' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Inbox' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'cats' })).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: /window 1 selection actions/i }),
    ).not.toBeInTheDocument();
  });

  it('clears a tab from the selection when its × is armed and confirmed', async () => {
    const port = new FakeTabsPort(sampleTabs);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('link', { name: 'pull/123' });

    await user.click(screen.getByRole('checkbox', { name: 'Select pull/123' }));
    await user.click(screen.getByRole('checkbox', { name: 'Select Inbox' }));

    const window1Actions = screen.getByRole('region', { name: /window 1 selection actions/i });
    expect(within(window1Actions).getByText(/2 tabs selected/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close pull/123' }));
    await user.click(screen.getByRole('button', { name: 'Confirm close pull/123' }));

    expect(port.closeManyCalls).toEqual([[1]]);
    expect(within(window1Actions).getByText(/1 tab selected/i)).toBeInTheDocument();
  });

  it('Select all in a section selects every tab in that section only', async () => {
    const port = new FakeTabsPort(sampleTabs);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('link', { name: 'pull/123' });

    const window1 = screen.getByRole('region', { name: /^window 1$/i });
    await user.click(within(window1).getByRole('button', { name: /select all/i }));

    // 2 tabs in Window 1, none in Window 2.
    const window1Actions = screen.getByRole('region', { name: /window 1 selection actions/i });
    expect(within(window1Actions).getByText(/2 tabs selected/i)).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: /window 2 selection actions/i }),
    ).not.toBeInTheDocument();

    expect(screen.getByRole('checkbox', { name: 'Select pull/123' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Select Inbox' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Select cats' })).not.toBeChecked();
  });

  it('Clear all in a section removes only that section from the selection', async () => {
    const port = new FakeTabsPort(sampleTabs);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('link', { name: 'pull/123' });

    const window1 = screen.getByRole('region', { name: /^window 1$/i });
    const window2 = screen.getByRole('region', { name: /^window 2$/i });
    await user.click(within(window1).getByRole('button', { name: /select all/i }));
    await user.click(within(window2).getByRole('button', { name: /select all/i }));

    expect(
      within(screen.getByRole('region', { name: /window 1 selection actions/i })).getByText(
        /2 tabs selected/i,
      ),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: /window 2 selection actions/i })).getByText(
        /1 tab selected/i,
      ),
    ).toBeInTheDocument();

    // Clear Window 1 only — Window 2's tab stays selected.
    await user.click(within(window1).getByRole('button', { name: /keep all/i }));

    expect(
      screen.queryByRole('region', { name: /window 1 selection actions/i }),
    ).not.toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: /window 2 selection actions/i })).getByText(
        /1 tab selected/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select cats' })).toBeChecked();
  });

  it("opens a new tab before closing when the section's Delete empties Chrome", async () => {
    const port = new FakeTabsPort(sampleTabs);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('link', { name: 'pull/123' });

    // First: delete every Window 1 tab — Window 2's cats remains, no new-tab call.
    const window1 = screen.getByRole('region', { name: /^window 1$/i });
    await user.click(within(window1).getByRole('button', { name: /select all/i }));
    await user.click(
      within(screen.getByRole('region', { name: /window 1 selection actions/i })).getByRole(
        'button',
        { name: 'Close?' },
      ),
    );
    expect(port.closeManyCalls).toEqual([[1, 2]]);
    expect(port.newTabCalls).toBe(0);

    // After the first delete, `cats` is the only tab. by-window grouping
    // re-numbers it as "Window 1" since its windowId is now the lowest
    // remaining. Select and delete that last tab — the new-tab safety net
    // fires.
    expect(screen.getByRole('link', { name: 'cats' })).toBeInTheDocument();
    const remainingSection = screen.getByRole('region', { name: /^window 1$/i });
    await user.click(within(remainingSection).getByRole('button', { name: /select all/i }));
    await user.click(
      within(screen.getByRole('region', { name: /window 1 selection actions/i })).getByRole(
        'button',
        { name: 'Close?' },
      ),
    );
    expect(port.closeManyCalls).toEqual([[1, 2], [3]]);
    expect(port.newTabCalls).toBe(1);
  });

  it('opens a new tab when confirming a × delete on the very last open tab', async () => {
    const port = new FakeTabsPort([sampleTabs[0]!]);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('link', { name: 'pull/123' });

    await user.click(screen.getByRole('button', { name: 'Close pull/123' }));
    await user.click(screen.getByRole('button', { name: 'Confirm close pull/123' }));

    expect(port.closeManyCalls).toEqual([[1]]);
    expect(port.newTabCalls).toBe(1);
  });

  it('reverts the armed × pill back to × when the user clicks elsewhere', async () => {
    const port = new FakeTabsPort(sampleTabs);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('link', { name: 'pull/123' });

    await user.click(screen.getByRole('button', { name: 'Close pull/123' }));
    expect(screen.getByRole('button', { name: 'Confirm close pull/123' })).toBeInTheDocument();

    // Click anywhere outside the armed pill — the page heading is a fine
    // "anywhere else" target. The mousedown listener fires and disarms.
    await user.click(screen.getByRole('heading', { name: /browser-zero/i }));

    expect(
      screen.queryByRole('button', { name: 'Confirm close pull/123' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close pull/123' })).toBeInTheDocument();
    expect(port.closeManyCalls).toEqual([]);
  });

  it('reverts the armed × pill back to × when the Keep button is clicked', async () => {
    const port = new FakeTabsPort(sampleTabs);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('link', { name: 'pull/123' });

    await user.click(screen.getByRole('button', { name: 'Close pull/123' }));
    expect(screen.getByRole('button', { name: 'Confirm close pull/123' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Keep pull/123' }));

    expect(
      screen.queryByRole('button', { name: 'Confirm close pull/123' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Keep pull/123' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close pull/123' })).toBeInTheDocument();
    expect(port.closeManyCalls).toEqual([]);
  });

  it('cancels a bulk delete if the user dismisses the confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    const port = new FakeTabsPort(sampleTabs);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('link', { name: 'pull/123' });

    await user.click(screen.getByRole('checkbox', { name: 'Select pull/123' }));
    await user.click(screen.getByRole('checkbox', { name: 'Select Inbox' }));

    await user.click(
      within(screen.getByRole('region', { name: /window 1 selection actions/i })).getByRole(
        'button',
        { name: 'Close?' },
      ),
    );

    expect(window.confirm).toHaveBeenCalledWith('Close 2 tabs?');
    expect(port.closeManyCalls).toEqual([]);
    expect(screen.getByRole('link', { name: 'pull/123' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inbox' })).toBeInTheDocument();
  });

  it('moves a tab to another window when dragged onto a different window section', async () => {
    const port = new FakeTabsPort(sampleTabs);

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('link', { name: 'pull/123' });

    const sourceRow = screen.getByRole('link', { name: 'pull/123' }).closest('li');
    const targetSection = screen.getByRole('region', { name: /^window 2$/i });
    if (!sourceRow) throw new Error('expected to find the source row');

    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(sourceRow, { dataTransfer });
    fireEvent.dragOver(targetSection, { dataTransfer });
    fireEvent.drop(targetSection, { dataTransfer });

    await waitFor(() => {
      expect(port.moveToWindowCalls).toEqual([{ tabId: 1, windowId: 200 }]);
    });
    expect(port.assignToGroupCalls).toEqual([]);
    expect(port.removeFromGroupCalls).toEqual([]);
  });

  it('assigns a tab to a Chrome tab group when dropped on that group in By tab group view', async () => {
    const groupedSample: readonly Tab[] = [
      {
        id: 10,
        windowId: 100,
        title: 'spec',
        url: 'https://github.com/me/repo/issues/9',
        domain: 'github.com',
        lastAccessed: fiveMinAgo,
        group: { id: 1, title: 'Q3 planning', color: 'blue' },
      },
      {
        id: 12,
        windowId: 100,
        title: 'random',
        url: 'https://example.com/',
        domain: 'example.com',
        lastAccessed: fiveMinAgo,
        group: null,
      },
    ];
    const port = new FakeTabsPort(groupedSample);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('link', { name: 'spec' });

    await user.click(screen.getByRole('radio', { name: /by tab group/i }));

    const sourceRow = screen.getByRole('link', { name: 'random' }).closest('li');
    const targetSection = screen.getByRole('region', { name: 'Q3 planning' });
    if (!sourceRow) throw new Error('expected to find the source row');

    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(sourceRow, { dataTransfer });
    fireEvent.dragOver(targetSection, { dataTransfer });
    fireEvent.drop(targetSection, { dataTransfer });

    await waitFor(() => {
      expect(port.assignToGroupCalls).toEqual([{ tabId: 12, groupId: 1 }]);
    });
    expect(port.moveToWindowCalls).toEqual([]);
    expect(port.removeFromGroupCalls).toEqual([]);
  });

  it('removes a tab from its group when dropped on the Ungrouped section', async () => {
    const groupedSample: readonly Tab[] = [
      {
        id: 10,
        windowId: 100,
        title: 'spec',
        url: 'https://github.com/me/repo/issues/9',
        domain: 'github.com',
        lastAccessed: fiveMinAgo,
        group: { id: 1, title: 'Q3 planning', color: 'blue' },
      },
      {
        id: 12,
        windowId: 100,
        title: 'random',
        url: 'https://example.com/',
        domain: 'example.com',
        lastAccessed: fiveMinAgo,
        group: null,
      },
    ];
    const port = new FakeTabsPort(groupedSample);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('link', { name: 'spec' });

    await user.click(screen.getByRole('radio', { name: /by tab group/i }));

    const sourceRow = screen.getByRole('link', { name: 'spec' }).closest('li');
    const targetSection = screen.getByRole('region', { name: 'Ungrouped' });
    if (!sourceRow) throw new Error('expected to find the source row');

    const dataTransfer = createDataTransfer();
    fireEvent.dragStart(sourceRow, { dataTransfer });
    fireEvent.dragOver(targetSection, { dataTransfer });
    fireEvent.drop(targetSection, { dataTransfer });

    await waitFor(() => {
      expect(port.removeFromGroupCalls).toEqual([10]);
    });
    expect(port.assignToGroupCalls).toEqual([]);
    expect(port.moveToWindowCalls).toEqual([]);
  });

  it('disables drag on rows when in By domain in url view (read-only)', async () => {
    const port = new FakeTabsPort(sampleTabs);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('link', { name: 'pull/123' });

    await user.click(screen.getByRole('radio', { name: /by domain in url/i }));

    const row = screen.getByRole('link', { name: 'pull/123' }).closest('li');
    if (!row) throw new Error('expected to find the row');
    expect(row).toHaveAttribute('draggable', 'false');
  });
});
