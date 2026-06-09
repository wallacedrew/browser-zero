# Add domain selection to a Chrome tab group

- **Status**: approved
- **Date**: 2026-06-08
- **Slice**: small. Behavior change is one flag flip + one cross-window guard helper.

## Context

The dashboard already supports a bulk "Add to group ▾" action per section: select tabs in a section, pick **Create new group** or **Add to existing group** in `GroupPicker`, and the selection is grouped via `chrome.tabs.group`. This action is wired up for the **By window** and **By tab group** grouping modes but explicitly hidden in the **By domain in url** mode.

The hiding is intentional and load-bearing: `DomainGrouping.allowGrouping = false` in `src/shared/lib/grouping.ts`, with the behaviour pinned by `tests-medium-integration/dashboard/dashboard.test.tsx` at the test "hides the Add to group action in By domain in url view".

The user wants this gate removed: when grouped By domain in url, the same "Select all" + "Add to group" flow should be available, so a whole domain bucket (e.g. every `github.com` tab) can be turned into a Chrome tab group in one go.

The wrinkle is that Chrome tab groups are **window-scoped**. A domain bucket can span multiple windows, but a tab group lives in exactly one window. `chrome.tabs.group({ groupId, tabIds })` will physically _move_ every supplied tab into the group's host window. The same applies to `createGroup` — Chrome picks the first tabId's window as host and yanks the rest in. By window and By tab group selections are single-window by construction, so today's code has never had to think about this; the domain view is the first case where it matters.

## Decision

Flip `DomainGrouping.allowGrouping` to `true` and gate the two cross-window mutations (`createGroup` and `assignManyToGroup`) behind a confirmation prompt when the selection spans 2+ windows.

### Behaviour

1. **Section header — no change.** Every section header already renders a "Select all" button. It works for domain sections today; the request was about what happens _after_ selection.

2. **Action panel** — `SectionActionPanel` already renders "Add to group ▾" gated by `allowGrouping`. Flipping the flag is sufficient to make it appear in domain sections.

3. **Cross-window guard** — Before either mutation calls into the port, compute the window spread of the selected tabIds:
   - **Single window**: short-circuit, no prompt, behave exactly as today.
   - **Multiple windows**: `window.confirm` with copy of the form `"Move N tabs from M other windows into \"<target>\"?"`.
     - For **Add to existing group**: `<target>` is the group's title (or `"Untitled"` if blank). The host window is the existing group's current window.
     - For **Create new group**: `<target>` is the title the user typed (or `"new group"` if blank). The host window is deterministic — the window holding the most selected tabs, ties broken by lowest `windowId`. We reorder `tabIds` to put host-window tabs first so Chrome hosts the new group there.
   - If the user cancels the prompt, no port call is made and the selection is preserved.

4. **Drag-into-group from domain view** — out of scope. `DomainGrouping.dropEnabled` stays `false`. The drop dispatch helper for domain grouping remains a no-op as it is today.

### Code shape

| File                                                              | Change                                                                                                                                                                                                         |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/shared/lib/grouping.ts`                                      | `DomainGrouping.allowGrouping: true`. `dropEnabled` unchanged.                                                                                                                                                 |
| `src/dashboard/lib/crossWindowGuard.ts` _(new)_                   | Pure helper: `analyzeWindowSpread(tabIds, tabs)` → `{ hostWindowId, otherWindowCount, orderedTabIds }`. Plus a tiny `confirmCrossWindowMove(label, otherWindowCount, confirm)` that decides whether to prompt. |
| `src/dashboard/hooks/useTabMutations.ts`                          | `createGroup` and `assignManyToGroup` consult the guard helper before calling the port. New dep: the helper module.                                                                                            |
| `tests-small-unit/dashboard/lib/crossWindowGuard.test.ts` _(new)_ | Microtests for the pure helper.                                                                                                                                                                                |
| `tests-medium-integration/dashboard/dashboard.test.tsx`           | Delete the test that pins the old hidden behaviour. Add three new tests pinning the new behaviour.                                                                                                             |

The guard's purity (a function from tabIds + tabs → an analysis) keeps `useTabMutations.ts` humble and means every cross-window decision is unit-testable in milliseconds.

### Tests

- **Unit** — `analyzeWindowSpread`:
  - empty input → empty result, no host
  - single window → host = that window, `otherWindowCount = 0`, ordering preserved
  - multi-window, clear majority → host = majority window, others come last
  - multi-window, tied counts → host = lowest `windowId`, deterministic ordering
  - tabIds containing ids not in `tabs` → ignored
- **Integration** (`tests-medium-integration/dashboard/dashboard.test.tsx`):
  - **Replace** "hides the Add to group action in By domain in url view" — this is the behaviour being lifted; the test is now false documentation.
  - **Add** "adds every github.com tab to a new Reading group from the domain view" — selects all in a multi-window domain section, opens picker, creates new group, confirms the prompt, asserts `FakeTabsPort.createGroup` was called with host-window-first tabIds.
  - **Add** "warns before moving tabs across windows when adding to an existing group" — same setup, but picks an existing group; asserts the prompt copy and that cancelling skips the port call.
  - **Add** "skips the confirm for a single-window domain selection" — single-window domain bucket, no prompt, port call happens directly.

`FakeTabsPort` already records `assignManyToGroup` and `createGroup` calls; no new fakes required. `window.confirm` is already stubbed/asserted via Vitest in the bulk-close path; the new tests follow the same pattern.

### Outer ATDD test

The integration test "adds every github.com tab to a new Reading group from the domain view" is the acceptance test for this slice. It stays red until every layer (grouping flag, guard helper, mutation wiring, GroupPicker plumbing) is in place.

## Consequences

**Easier:**

- One-step "make a Chrome tab group out of every github.com tab I have open" — the most common use case the dashboard's domain view exists to serve.
- Cross-window grouping has a predictable, host-window-deterministic outcome instead of "first selected tab's window wins implicitly."
- The mutation layer gains a reusable cross-window guard that the drag-into-group slice can reuse later.

**Harder:**

- Cross-window grouping physically moves tabs between Chrome windows. The confirm prompt mitigates surprise but doesn't eliminate it. Users who hit Yes without reading the message will see tabs migrate.
- `useTabMutations.assignManyToGroup` and `createGroup` are no longer "thin wrappers over the port" — they now own a small product decision (whether to prompt). The guard helper keeps the logic out of the hook, but the hook does call `window.confirm`, which makes it shell-y. That's consistent with the existing `deleteMany` pattern.

**New constraints:**

- The integration test for "Add to group" in domain view depends on `window.confirm` being stubbed in the test harness. The pattern exists for `deleteMany`; this just extends it.
- Any future grouping mode that can span multiple windows (none planned) would need to opt into the same guard.

**Follow-up work parked, not done now:**

- Drag-into-group from the domain view (`DomainGrouping.dropEnabled = true`) — separate slice; requires its own product call on what dropping a single tab into a domain-foreign group should mean.
- A one-click "Group every domain at once" affordance — a different slice; this design only addresses the per-section path.
- Remembering the last-used group title for the "Create new group" input — pure ergonomics; backlog.

## Out of scope

- Changes to grouping logic for the By window and By tab group modes.
- Changes to the favicon, search, or selection persistence behaviour.
- Any change to the manifest, permissions, or `ChromeTabsAdapter` surface — the existing `assignManyToGroup` and `createGroup` port methods already do everything needed.
