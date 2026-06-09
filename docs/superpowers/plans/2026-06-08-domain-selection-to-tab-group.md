# Domain Selection → Chrome Tab Group Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user select all tabs in a domain section (e.g. every `github.com` tab) and either create a new Chrome tab group from them or add them to an existing one — with a confirm prompt when the selection spans multiple Chrome windows.

**Architecture:** One flag flip in `grouping.ts` makes the existing "Add to group ▾" UI render in domain sections. A new pure helper `crossWindowGuard.ts` computes which window should host the resulting group and reorders tabIds host-window-first. `useTabMutations.ts` calls the helper before `port.createGroup` / `port.assignManyToGroup` and prompts via `window.confirm` when the selection crosses windows. The mutation hook stays humble; all logic is in the pure helper.

**Tech Stack:** TypeScript strict, React 19, Vitest + React Testing Library, Vite + crxjs (Chrome MV3).

---

## File map

- **Create** `src/dashboard/lib/crossWindowGuard.ts` — pure helper with `analyzeForNewGroup(tabIds, tabs)` and `analyzeForExistingGroup(tabIds, tabs, groupId)`.
- **Create** `tests-small-unit/dashboard/lib/crossWindowGuard.test.ts` — microtests.
- **Modify** `src/shared/lib/grouping.ts` — flip `DomainGrouping.allowGrouping` to `true`.
- **Modify** `src/dashboard/hooks/useTabMutations.ts` — `createGroup` and `assignManyToGroup` consult the guard, prompt on multi-window, reorder tabIds.
- **Modify** `tests-medium-integration/dashboard/dashboard.test.tsx` — delete the obsolete pinning test; add three new ATDD/integration tests.

No other files change. `GroupPicker`, `SectionActionPanel`, `TabGroupSectionHeader`, `useExistingGroups`, `FakeTabsPort`, `ChromeTabsAdapter` are all untouched — the existing wiring already does what we need once `allowGrouping` is `true`.

---

## Task 1: Unit — empty input returns null

**Files:**

- Create: `tests-small-unit/dashboard/lib/crossWindowGuard.test.ts`
- Create: `src/dashboard/lib/crossWindowGuard.ts`

- [ ] **Step 1: Write the failing test**

`tests-small-unit/dashboard/lib/crossWindowGuard.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { analyzeForNewGroup } from '../../../src/dashboard/lib/crossWindowGuard';
import type { Tab } from '../../../src/shared/lib/types';
import { Timestamp } from '../../../src/shared/lib/Timestamp';

const now = Timestamp.fromMillis(0);

function tab(id: number, windowId: number): Tab {
  return {
    id,
    windowId,
    title: `tab-${String(id)}`,
    url: `https://example.com/${String(id)}`,
    domain: 'example.com',
    favIconUrl: null,
    lastAccessed: now,
    group: null,
  };
}

describe('analyzeForNewGroup', () => {
  it('returns null when no tabIds are supplied', () => {
    expect(analyzeForNewGroup([], [tab(1, 100)])).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests-small-unit/dashboard/lib/crossWindowGuard.test.ts`
Expected: FAIL — module `crossWindowGuard` not found.

- [ ] **Step 3: Write minimal implementation**

`src/dashboard/lib/crossWindowGuard.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests-small-unit/dashboard/lib/crossWindowGuard.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests-small-unit/dashboard/lib/crossWindowGuard.test.ts src/dashboard/lib/crossWindowGuard.ts
git commit -m "feat(crossWindowGuard): handle empty tabId input"
```

---

## Task 2: Unit — single-window selection preserves order, no other windows

**Files:**

- Modify: `tests-small-unit/dashboard/lib/crossWindowGuard.test.ts`
- Modify: `src/dashboard/lib/crossWindowGuard.ts`

- [ ] **Step 1: Write the failing test**

Append to the `describe('analyzeForNewGroup', …)` block:

```ts
it('keeps tabId order and reports no other windows when all tabs share one window', () => {
  const tabs = [tab(1, 100), tab(2, 100), tab(3, 100)];

  const result = analyzeForNewGroup([3, 1, 2], tabs);

  expect(result).toEqual({
    hostWindowId: 100,
    otherWindowCount: 0,
    orderedTabIds: [3, 1, 2],
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests-small-unit/dashboard/lib/crossWindowGuard.test.ts`
Expected: FAIL — returned `null`, expected an analysis object.

- [ ] **Step 3: Write minimal implementation**

Replace the body of `analyzeForNewGroup` in `src/dashboard/lib/crossWindowGuard.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests-small-unit/dashboard/lib/crossWindowGuard.test.ts`
Expected: PASS (both cases).

- [ ] **Step 5: Commit**

```bash
git add tests-small-unit/dashboard/lib/crossWindowGuard.test.ts src/dashboard/lib/crossWindowGuard.ts
git commit -m "feat(crossWindowGuard): handle single-window selection"
```

---

## Task 3: Unit — multi-window picks majority host, reorders host-first

**Files:**

- Modify: `tests-small-unit/dashboard/lib/crossWindowGuard.test.ts`
- Modify: `src/dashboard/lib/crossWindowGuard.ts`

- [ ] **Step 1: Write the failing test**

Append:

```ts
it('picks the majority window as host and reorders host-window tabs first', () => {
  const tabs = [tab(1, 100), tab(2, 200), tab(3, 200), tab(4, 200), tab(5, 100)];

  const result = analyzeForNewGroup([1, 2, 3, 4, 5], tabs);

  expect(result).toEqual({
    hostWindowId: 200,
    otherWindowCount: 1,
    orderedTabIds: [2, 3, 4, 1, 5],
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests-small-unit/dashboard/lib/crossWindowGuard.test.ts`
Expected: FAIL — `hostWindowId` returned 100 (first inserted), not the majority 200.

- [ ] **Step 3: Write minimal implementation**

Replace `analyzeForNewGroup` body in `src/dashboard/lib/crossWindowGuard.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests-small-unit/dashboard/lib/crossWindowGuard.test.ts`
Expected: PASS (three cases).

- [ ] **Step 5: Commit**

```bash
git add tests-small-unit/dashboard/lib/crossWindowGuard.test.ts src/dashboard/lib/crossWindowGuard.ts
git commit -m "feat(crossWindowGuard): pick majority host window and reorder host-first"
```

---

## Task 4: Unit — tied counts break to lowest windowId

**Files:**

- Modify: `tests-small-unit/dashboard/lib/crossWindowGuard.test.ts`
- Modify: `src/dashboard/lib/crossWindowGuard.ts`

- [ ] **Step 1: Write the failing test**

Append:

```ts
it('breaks ties by picking the lowest windowId as host', () => {
  const tabs = [tab(1, 200), tab(2, 100), tab(3, 200), tab(4, 100)];

  const result = analyzeForNewGroup([1, 2, 3, 4], tabs);

  expect(result?.hostWindowId).toBe(100);
  expect(result?.otherWindowCount).toBe(1);
  expect(result?.orderedTabIds).toEqual([2, 4, 1, 3]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests-small-unit/dashboard/lib/crossWindowGuard.test.ts`
Expected: FAIL — picks 200 (first one with count 2), not lowest.

- [ ] **Step 3: Write minimal implementation**

Update `pickHostWindow` in `src/dashboard/lib/crossWindowGuard.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests-small-unit/dashboard/lib/crossWindowGuard.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests-small-unit/dashboard/lib/crossWindowGuard.test.ts src/dashboard/lib/crossWindowGuard.ts
git commit -m "feat(crossWindowGuard): break host-window ties by lowest windowId"
```

---

## Task 5: Unit — stale tabIds (not in tabs) are ignored

**Files:**

- Modify: `tests-small-unit/dashboard/lib/crossWindowGuard.test.ts`

- [ ] **Step 1: Write the failing test**

Append:

```ts
it('ignores tabIds that do not match any current tab', () => {
  const tabs = [tab(1, 100), tab(2, 100)];

  const result = analyzeForNewGroup([1, 999, 2, 42], tabs);

  expect(result).toEqual({
    hostWindowId: 100,
    otherWindowCount: 0,
    orderedTabIds: [1, 2],
  });
});

it('returns null when every supplied tabId is stale', () => {
  const tabs = [tab(1, 100)];

  expect(analyzeForNewGroup([42, 99], tabs)).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `pnpm vitest run tests-small-unit/dashboard/lib/crossWindowGuard.test.ts`
Expected: PASS — the existing implementation already filters stale ids via `windowById.has(id)`.

- [ ] **Step 3: Commit**

```bash
git add tests-small-unit/dashboard/lib/crossWindowGuard.test.ts
git commit -m "test(crossWindowGuard): pin stale-tabId filtering"
```

---

## Task 6: Unit — `analyzeForExistingGroup` hosts on the group's window

**Files:**

- Modify: `tests-small-unit/dashboard/lib/crossWindowGuard.test.ts`
- Modify: `src/dashboard/lib/crossWindowGuard.ts`

- [ ] **Step 1: Write the failing test**

Add this describe block at the bottom of the test file. Augment the `tab(…)` helper to allow attaching a group (or define an inline tab-with-group factory). Either works; show the inline factory here:

```ts
import { analyzeForExistingGroup } from '../../../src/dashboard/lib/crossWindowGuard';

function groupedTab(id: number, windowId: number, groupId: number): Tab {
  return { ...tab(id, windowId), group: { id: groupId, title: 'Reading', color: 'blue' } };
}

describe('analyzeForExistingGroup', () => {
  it('returns null when the selection is empty', () => {
    expect(analyzeForExistingGroup([], [tab(1, 100)], 7)).toBeNull();
  });

  it('returns null when no current tab belongs to the target group', () => {
    expect(analyzeForExistingGroup([1, 2], [tab(1, 100), tab(2, 100)], 7)).toBeNull();
  });

  it("hosts on the existing group's window and counts other selection windows", () => {
    const tabs = [tab(1, 100), tab(2, 200), tab(3, 300), groupedTab(99, 200, 7)];

    const result = analyzeForExistingGroup([1, 2, 3], tabs, 7);

    expect(result).toEqual({
      hostWindowId: 200,
      otherWindowCount: 2,
      orderedTabIds: [2, 1, 3],
    });
  });

  it("reports no other windows when every selected tab already lives in the group's window", () => {
    const tabs = [tab(1, 200), tab(2, 200), groupedTab(99, 200, 7)];

    const result = analyzeForExistingGroup([1, 2], tabs, 7);

    expect(result).toEqual({
      hostWindowId: 200,
      otherWindowCount: 0,
      orderedTabIds: [1, 2],
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests-small-unit/dashboard/lib/crossWindowGuard.test.ts`
Expected: FAIL — `analyzeForExistingGroup` is not exported.

- [ ] **Step 3: Write minimal implementation**

Append to `src/dashboard/lib/crossWindowGuard.ts`:

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests-small-unit/dashboard/lib/crossWindowGuard.test.ts`
Expected: PASS (all describe blocks).

- [ ] **Step 5: Commit**

```bash
git add tests-small-unit/dashboard/lib/crossWindowGuard.test.ts src/dashboard/lib/crossWindowGuard.ts
git commit -m "feat(crossWindowGuard): analyze selection against an existing group"
```

---

## Task 7: Behavior — flip `DomainGrouping.allowGrouping`; delete obsolete pinning test

**Files:**

- Modify: `src/shared/lib/grouping.ts:73-88`
- Modify: `tests-medium-integration/dashboard/dashboard.test.tsx:906-923`

- [ ] **Step 1: Delete the obsolete pinning test**

Remove the entire `it('hides the Add to group action in By domain in url view', …)` block from `tests-medium-integration/dashboard/dashboard.test.tsx`. This test pins the behaviour we are explicitly changing — keeping it would block the new behaviour from landing.

- [ ] **Step 2: Flip the grouping flag**

In `src/shared/lib/grouping.ts`, change the `DomainGrouping` literal:

```ts
const DomainGrouping: GroupingStrategy = {
  keyOf: (tab) => tab.domain,
  compareEntries: ([leftKey, leftTabs], [rightKey, rightTabs]) => {
    const countDelta = rightTabs.length - leftTabs.length;
    if (countDelta !== 0) return countDelta;
    return leftKey.localeCompare(rightKey);
  },
  makeOutputKey: (bucketKey) => `domain-${bucketKey}`,
  makeLabel: (bucketKey) => bucketKey,
  dropEnabled: false,
  allowGrouping: true,
  sectionColorOf: () => null,
  dispatchDrop: () => {
    /* DomainGrouping has dropEnabled: false; this is never invoked. */
  },
};
```

(Only the `allowGrouping` line changes; the rest is shown for surrounding context. `dropEnabled` stays `false` — drag-into-group is out of scope for this slice.)

- [ ] **Step 3: Run the suite**

Run: `pnpm test`
Expected: PASS. The deleted test is gone; no other test asserts the hide-when-domain behaviour. The slice's new ATDD test is added in the next task.

- [ ] **Step 4: Commit**

```bash
git add src/shared/lib/grouping.ts tests-medium-integration/dashboard/dashboard.test.tsx
git commit -m "feat(grouping): allow Add-to-group action in By domain in url view"
```

---

## Task 8: Integration ATDD — create a new tab group from a multi-window domain selection

**Files:**

- Modify: `tests-medium-integration/dashboard/dashboard.test.tsx`
- Modify: `src/dashboard/hooks/useTabMutations.ts`

This is the outer-loop acceptance test for the slice. It exercises every layer end-to-end: domain grouping → select-all → action panel → group picker → cross-window guard → mutation hook → port.

- [ ] **Step 1: Write the failing test**

Add this `it` block at the end of the top-level `describe('dashboard', …)` in `tests-medium-integration/dashboard/dashboard.test.tsx`:

```ts
  it('adds every github.com tab to a new Reading group from the domain view', async () => {
    const multiWindowGithubTabs: readonly Tab[] = [
      {
        id: 1,
        windowId: 100,
        title: 'pull/123',
        url: 'https://github.com/me/repo/pull/123',
        domain: 'github.com',
        favIconUrl: null,
        lastAccessed: fiveMinAgo,
        group: null,
      },
      {
        id: 2,
        windowId: 200,
        title: 'pull/456',
        url: 'https://github.com/me/repo/pull/456',
        domain: 'github.com',
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
        lastAccessed: fiveMinAgo,
        group: null,
      },
    ];
    const port = new FakeTabsPort(multiWindowGithubTabs);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('link', { name: 'pull/123' });

    await user.click(screen.getByRole('radio', { name: /by domain in url/i }));

    const section = await screen.findByRole('region', { name: 'github.com' });
    await user.click(within(section).getByRole('button', { name: /select all/i }));

    await user.click(within(section).getByRole('button', { name: /add to group/i }));
    await user.type(screen.getByRole('textbox', { name: /name new group/i }), 'Reading');
    fireEvent.submit(screen.getByRole('textbox', { name: /name new group/i }).closest('form')!);

    await waitFor(() => {
      expect(port.createGroupCalls).toHaveLength(1);
    });
    const call = port.createGroupCalls[0]!;
    expect(call.title).toBe('Reading');
    expect([...call.tabIds].sort()).toEqual([1, 2]);
    // Window 200 holds the majority of github tabs (id 2), so it hosts;
    // host-window tabs come first in the call to nudge Chrome to host there.
    expect(call.tabIds[0]).toBe(2);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests-medium-integration/dashboard/dashboard.test.tsx -t 'adds every github.com tab'`
Expected: FAIL — `call.tabIds[0]` is `1` (selection order), not `2` (host-window-first). The Add-to-group button now renders (Task 7) and the port is called, but the guard isn't wired yet.

- [ ] **Step 3: Wire `createGroup` to the guard**

In `src/dashboard/hooks/useTabMutations.ts`, add the import at the top:

```ts
import { analyzeForNewGroup, analyzeForExistingGroup } from '../lib/crossWindowGuard';
```

(`analyzeForExistingGroup` is used by Task 9; importing both now keeps the import block stable.)

Replace the body of `createGroup`:

```ts
const createGroup = useCallback(
  async (tabIds: readonly number[], title: string) => {
    const analysis = analyzeForNewGroup(tabIds, tabs);
    if (!analysis) return;

    if (analysis.otherWindowCount > 0) {
      const target = title.length > 0 ? title : 'new group';
      const message =
        `Move ${String(analysis.orderedTabIds.length)} tabs from ` +
        `${String(analysis.otherWindowCount)} other window` +
        `${analysis.otherWindowCount === 1 ? '' : 's'} into "${target}"?`;
      if (!window.confirm(message)) return;
    }

    await tabsPort.createGroup(analysis.orderedTabIds, title);
    clearAllSelection();
    await refresh();
  },
  [tabs, tabsPort, refresh, clearAllSelection],
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests-medium-integration/dashboard/dashboard.test.tsx -t 'adds every github.com tab'`
Expected: PASS — host-window-first ordering puts id 2 ahead of id 1.

- [ ] **Step 5: Run the full fast suite**

Run: `pnpm test`
Expected: PASS — no other test should regress.

- [ ] **Step 6: Commit**

```bash
git add tests-medium-integration/dashboard/dashboard.test.tsx src/dashboard/hooks/useTabMutations.ts
git commit -m "feat(useTabMutations): create cross-window group via guard with confirm"
```

---

## Task 9: Integration — assign cross-window selection to an existing group

**Files:**

- Modify: `tests-medium-integration/dashboard/dashboard.test.tsx`
- Modify: `src/dashboard/hooks/useTabMutations.ts`

- [ ] **Step 1: Write the failing test**

Append inside the same top-level `describe('dashboard', …)`:

```ts
  it('warns before moving tabs across windows when adding to an existing group', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const multiWindowTabs: readonly Tab[] = [
      {
        id: 1,
        windowId: 100,
        title: 'pull/123',
        url: 'https://github.com/me/repo/pull/123',
        domain: 'github.com',
        favIconUrl: null,
        lastAccessed: fiveMinAgo,
        group: null,
      },
      {
        id: 2,
        windowId: 200,
        title: 'pull/456',
        url: 'https://github.com/me/repo/pull/456',
        domain: 'github.com',
        favIconUrl: null,
        lastAccessed: fiveMinAgo,
        group: null,
      },
      {
        id: 9,
        windowId: 200,
        title: 'reading-list-host',
        url: 'https://example.com',
        domain: 'example.com',
        favIconUrl: null,
        lastAccessed: fiveMinAgo,
        group: { id: 77, title: 'Reading', color: 'blue' },
      },
    ];
    const port = new FakeTabsPort(multiWindowTabs);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('link', { name: 'pull/123' });

    await user.click(screen.getByRole('radio', { name: /by domain in url/i }));
    const section = await screen.findByRole('region', { name: 'github.com' });
    await user.click(within(section).getByRole('button', { name: /select all/i }));
    await user.click(within(section).getByRole('button', { name: /add to group/i }));
    await user.click(screen.getByRole('menuitem', { name: /reading/i }));

    expect(window.confirm).toHaveBeenCalledWith(
      'Move 2 tabs from 1 other window into "Reading"?',
    );
    await waitFor(() => {
      expect(port.assignManyToGroupCalls).toHaveLength(1);
    });
    expect(port.assignManyToGroupCalls[0]!.groupId).toBe(77);
    expect(port.assignManyToGroupCalls[0]!.tabIds[0]).toBe(2);
  });

  it('cancels the assign action when the user dismisses the cross-window prompt', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const multiWindowTabs: readonly Tab[] = [
      {
        id: 1,
        windowId: 100,
        title: 'pull/123',
        url: 'https://github.com/me/repo/pull/123',
        domain: 'github.com',
        favIconUrl: null,
        lastAccessed: fiveMinAgo,
        group: null,
      },
      {
        id: 2,
        windowId: 200,
        title: 'pull/456',
        url: 'https://github.com/me/repo/pull/456',
        domain: 'github.com',
        favIconUrl: null,
        lastAccessed: fiveMinAgo,
        group: null,
      },
      {
        id: 9,
        windowId: 200,
        title: 'reading-list-host',
        url: 'https://example.com',
        domain: 'example.com',
        favIconUrl: null,
        lastAccessed: fiveMinAgo,
        group: { id: 77, title: 'Reading', color: 'blue' },
      },
    ];
    const port = new FakeTabsPort(multiWindowTabs);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('link', { name: 'pull/123' });

    await user.click(screen.getByRole('radio', { name: /by domain in url/i }));
    const section = await screen.findByRole('region', { name: 'github.com' });
    await user.click(within(section).getByRole('button', { name: /select all/i }));
    await user.click(within(section).getByRole('button', { name: /add to group/i }));
    await user.click(screen.getByRole('menuitem', { name: /reading/i }));

    expect(window.confirm).toHaveBeenCalled();
    expect(port.assignManyToGroupCalls).toHaveLength(0);
  });
```

- [ ] **Step 2: Run tests to verify failure**

Run: `pnpm vitest run tests-medium-integration/dashboard/dashboard.test.tsx -t 'warns before moving tabs'`
Expected: FAIL — `window.confirm` was not called (current `assignManyToGroup` calls the port directly).

- [ ] **Step 3: Wire `assignManyToGroup` to the guard**

Replace `assignManyToGroup` in `src/dashboard/hooks/useTabMutations.ts`:

```ts
const assignManyToGroup = useCallback(
  async (tabIds: readonly number[], groupId: number) => {
    const analysis = analyzeForExistingGroup(tabIds, tabs, groupId);
    if (!analysis) return;

    if (analysis.otherWindowCount > 0) {
      const target = labelForExistingGroup(tabs, groupId);
      const message =
        `Move ${String(analysis.orderedTabIds.length)} tabs from ` +
        `${String(analysis.otherWindowCount)} other window` +
        `${analysis.otherWindowCount === 1 ? '' : 's'} into "${target}"?`;
      if (!window.confirm(message)) return;
    }

    await tabsPort.assignManyToGroup(analysis.orderedTabIds, groupId);
    clearAllSelection();
    await refresh();
  },
  [tabs, tabsPort, refresh, clearAllSelection],
);
```

Add this private helper at the bottom of `src/dashboard/hooks/useTabMutations.ts`, below the hook function:

```ts
function labelForExistingGroup(tabs: readonly Tab[], groupId: number): string {
  for (const tab of tabs) {
    if (tab.group?.id === groupId) {
      return tab.group.title.length > 0 ? tab.group.title : 'Untitled';
    }
  }
  return 'Untitled';
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `pnpm vitest run tests-medium-integration/dashboard/dashboard.test.tsx -t 'cross-window prompt'`
Run: `pnpm vitest run tests-medium-integration/dashboard/dashboard.test.tsx -t 'warns before moving tabs'`
Expected: PASS for both.

- [ ] **Step 5: Run the full fast suite**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tests-medium-integration/dashboard/dashboard.test.tsx src/dashboard/hooks/useTabMutations.ts
git commit -m "feat(useTabMutations): guard cross-window assign-to-existing with confirm"
```

---

## Task 10: Integration — single-window domain selection skips the confirm

**Files:**

- Modify: `tests-medium-integration/dashboard/dashboard.test.tsx`

This test pins the short-circuit branch. No code change is required; the existing implementation already only prompts when `otherWindowCount > 0`.

- [ ] **Step 1: Write the test**

Append inside the top-level `describe('dashboard', …)`:

```ts
  it('skips the confirm prompt for a single-window domain selection', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const sameWindowGithubTabs: readonly Tab[] = [
      {
        id: 1,
        windowId: 100,
        title: 'pull/123',
        url: 'https://github.com/me/repo/pull/123',
        domain: 'github.com',
        favIconUrl: null,
        lastAccessed: fiveMinAgo,
        group: null,
      },
      {
        id: 2,
        windowId: 100,
        title: 'pull/456',
        url: 'https://github.com/me/repo/pull/456',
        domain: 'github.com',
        favIconUrl: null,
        lastAccessed: fiveMinAgo,
        group: null,
      },
    ];
    const port = new FakeTabsPort(sameWindowGithubTabs);
    const user = userEvent.setup();

    render(<App tabsPort={port} now={now} />);
    await screen.findByRole('link', { name: 'pull/123' });

    await user.click(screen.getByRole('radio', { name: /by domain in url/i }));
    const section = await screen.findByRole('region', { name: 'github.com' });
    await user.click(within(section).getByRole('button', { name: /select all/i }));
    await user.click(within(section).getByRole('button', { name: /add to group/i }));
    await user.type(screen.getByRole('textbox', { name: /name new group/i }), 'Reading');
    fireEvent.submit(screen.getByRole('textbox', { name: /name new group/i }).closest('form')!);

    await waitFor(() => {
      expect(port.createGroupCalls).toHaveLength(1);
    });
    expect(confirmSpy).not.toHaveBeenCalled();
  });
```

- [ ] **Step 2: Run the test to verify it passes**

Run: `pnpm vitest run tests-medium-integration/dashboard/dashboard.test.tsx -t 'skips the confirm prompt'`
Expected: PASS.

- [ ] **Step 3: Run the full fast suite**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add tests-medium-integration/dashboard/dashboard.test.tsx
git commit -m "test(dashboard): pin single-window domain selection skips confirm"
```

---

## Task 11: Verification — manual smoke check

**No file changes.** Per AGENTS.md, automated tests are supplemented by a single manual real-Chrome smoke check.

- [ ] **Step 1: Build**

Run: `pnpm build`
Expected: dist/ produced without errors.

- [ ] **Step 2: Reload the extension**

In `chrome://extensions`, click the refresh icon on the `browser-zero` card.

- [ ] **Step 3: Set up a multi-window scenario**

Have ≥2 Chrome windows, each holding ≥2 `github.com` tabs.

- [ ] **Step 4: Exercise create-new path**

In the dashboard, switch to "By domain in url", expand the `github.com` section, click "Select all", click "Add to group ▾", type "Reading", press Enter, accept the confirm. Expected: a Reading tab group appears in one window; the other window's github tabs have moved into it.

- [ ] **Step 5: Exercise assign-to-existing path**

Open more github tabs in the window that does not host the Reading group. From the dashboard, select all github tabs, click "Add to group ▾", click "Reading", accept the confirm. Expected: those tabs move into the Reading group's window.

- [ ] **Step 6: Exercise the cancel path**

Repeat step 5 but click Cancel on the confirm. Expected: no tabs move; the selection is preserved.

- [ ] **Step 7: Exercise the single-window short-circuit**

Make sure all selected github tabs are in one window. Click "Add to group ▾" → "Create new group" → "Bench". Expected: no confirm prompt; group is created immediately.

- [ ] **Step 8: Re-run the fast suite**

Run: `pnpm test`
Expected: PASS — second verification pass per the project's two-pass discipline.

---

## Self-Review

**Spec coverage:**

- "Flip `DomainGrouping.allowGrouping` to `true`" — Task 7.
- "Pure helper `crossWindowGuard.ts`" — Tasks 1–6.
- "Both mutations consult the helper before calling the port" — Tasks 8 (createGroup) + 9 (assignManyToGroup).
- "Single-window short-circuit" — implementation in Task 8; pinned in Task 10.
- "Multi-window: `window.confirm` with copy" — implementation in Tasks 8 and 9; pinned in Tasks 8 (create-new path) and 9 (assign-existing path, both accept and cancel branches).
- "Host window deterministic — majority wins, ties by lowest windowId" — Tasks 3 + 4.
- "Reorder tabIds host-first" — Task 3 + Task 6.
- "Delete the obsolete pinning test" — Task 7.
- "Three new integration tests" — Tasks 8 (create-new), 9 (assign-existing + cancel — two tests in one task), 10 (single-window short-circuit).
- "`dropEnabled` stays `false`" — Task 7 explicitly notes no change.
- "No new port methods or fake methods" — verified; `assignManyToGroup` and `createGroup` already on `FakeTabsPort`.

**Placeholder scan:** no TBDs, no "add validation", no "handle edge cases", no "similar to Task N", every code block is concrete.

**Type consistency:**

- `CrossWindowAnalysis` shape (`hostWindowId`, `otherWindowCount`, `orderedTabIds`) is identical in `analyzeForNewGroup` and `analyzeForExistingGroup` (Tasks 2, 3, 6).
- Mutation hook uses `analysis.orderedTabIds` everywhere (Tasks 8, 9).
- Helper `labelForExistingGroup` takes `(tabs, groupId)` — matches the call site in Task 9.
- `analyzeForExistingGroup(tabIds, tabs, groupId)` parameter order — matches the call site.

No drift found.
