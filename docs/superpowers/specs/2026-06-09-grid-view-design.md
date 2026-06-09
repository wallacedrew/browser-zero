# Grid layout for the tab dashboard

- **Status**: approved
- **Date**: 2026-06-09
- **Slice**: medium. One new layout strategy + one new grouping mode + a new presentational tree (card + card grid). No port changes.

## Context

The dashboard currently has one rendering shape: a vertical list of `TabRow`s, optionally bucketed by window, tab group, or domain. The grouping is controlled by `ViewToggle`; switching grouping only changes how rows are bucketed, never how each tab is drawn.

When the user is sitting on 50+ open tabs and wants to scan by site identity (favicon + title), a list is the wrong tool. A favicon-forward card grid lets the user use peripheral vision to scan many tabs at once.

A grid view introduces two new questions:

1. **How does the user enter it?** Layout (List | Grid) is orthogonal to grouping (Window | Tab group | Domain): scanning by favicon may or may not want grouping. The cleanest answer is two independent toggles.
2. **What does the densest grid case look like?** Without a way to flatten the sections, the user can never get the all-tabs-at-once scan that's the marquee use case for Grid.

Both are addressed in this slice.

## Decision

Add **two orthogonal axes** to the dashboard: a layout axis (`List | Grid`) parallel to the existing grouping axis, and a fourth grouping option (`Flat`) that puts every tab in one bucket sorted by last-accessed descending. The Grid + Flat combination is the marquee scan view; the other 7 combinations also work.

### Behaviour

1. **Layout toggle.** A new `LayoutToggle` lives next to `ViewToggle` in `DashboardHeader`. Two options: `List` (default) and `Grid`. State lives in `App` like `groupBy` does today, with no cross-session persistence in this slice.

2. **Grid card content** — every card always shows favicon, group chip if the tab is in a Chrome tab group, last-accessed label, title (clamped to two lines), domain, plus an always-visible select checkbox and close button. Variant **X** from brainstorm: select top-left + favicon and group chip following; last-accessed top-right + close button following; title body; domain footer.

3. **Card click behaviour** — clicking anywhere on the card focuses the tab (calls `onFocus`). The select checkbox and close button stop propagation so corner clicks don't double-fire. This is a minor change from today's row, where only the title link focused.

4. **Card sizing** — responsive CSS grid: `grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))`, ~12px gap. Two columns on a narrow window, more on a wide one. No density slider.

5. **Flat grouping** — a fourth `GroupingStrategy` joining `WindowGrouping / TabGroupGrouping / DomainGrouping`. One bucket labeled `"All tabs"`. `allowGrouping: true` so "Select all → Add to group ▾" works in Flat too. `dropEnabled: false` (no meaningful drop target). `sectionColorOf: () => null`. The bucket is sorted by `lastAccessed` desc, ties broken by `tab.id` asc — added via a new `sortWithinBucket` method on `GroupingStrategy` (default identity for the existing three strategies).

6. **Drag in Grid** — same rules as List. A card is `draggable` iff the current `GroupingStrategy.dropEnabled` is true (so Window and Tab-group sections; not Domain, not Flat). Drop targets stay the section bodies as today; the card itself is not a drop target.

7. **Default** — `Window + List`, unchanged. The view-toggle and layout-toggle defaults are independent.

### Code shape

| File                                                        | Change                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/dashboard/lib/layout.ts` _(new)_                       | `LayoutBy = 'list' \| 'grid'`. `TabBodyProps` interface (mirrors today's `TabGroupSectionTabs` props). `LayoutStrategy { key, Body }`. Two strategy objects: `ListLayout` (`Body: TabGroupSectionTabs`) and `GridLayout` (`Body: TabGroupSectionCards`). `layoutStrategyFor(by)` selector. |
| `src/dashboard/components/LayoutToggle.tsx` _(new)_         | Two-option `radiogroup` mirroring `ViewToggle`. Props: `value: LayoutBy`, `onChange: (next) => void`.                                                                                                                                                                                      |
| `src/dashboard/components/TabCard.tsx` _(new)_              | One-card presentational component. Reuses `Favicon`, `GroupChip`, `TabTitleLink`, `TabDomain`, `TabLastAccessedLabel`, `TabSelectCheckbox`, `TabCloseAction`. Wraps in an `<li>` that is `draggable` iff the prop says so; whole-card click handler that delegates to `onFocus`.           |
| `src/dashboard/components/TabGroupSectionCards.tsx` _(new)_ | Grid-body component. Same `Props` shape as `TabGroupSectionTabs`. Renders `<ul id={listId} hidden={hidden}>` with a CSS grid class and one `<TabCard>` per tab.                                                                                                                            |
| `src/shared/lib/grouping.ts`                                | Add `'flat'` to `GroupBy`. Add `FlatGrouping` strategy. Add `sortWithinBucket` to `GroupingStrategy` (default identity; Flat sorts by `lastAccessed` desc, ties by `id` asc). `materializeGroups` calls it once per bucket before yielding.                                                |
| `src/dashboard/components/ViewToggle.tsx`                   | Add `{ value: 'flat', label: 'Flat' }` to `OPTIONS`.                                                                                                                                                                                                                                       |
| `src/dashboard/components/TabList.tsx`                      | Accept `layoutBy: LayoutBy`. Resolve `layoutStrategyFor(layoutBy)`. Pass the resolved strategy down to each `TabGroupSection`.                                                                                                                                                             |
| `src/dashboard/components/TabGroupSection.tsx`              | Accept `layout: LayoutStrategy` and render `<layout.Body {...bodyProps} />` instead of the hard-coded `<TabGroupSectionTabs>` import.                                                                                                                                                      |
| `src/dashboard/components/DashboardHeader.tsx`              | Render `LayoutToggle` next to `ViewToggle`. New props: `layoutBy`, `onLayoutByChange`.                                                                                                                                                                                                     |
| `src/dashboard/components/App.tsx`                          | `const [layoutBy, setLayoutBy] = useState<LayoutBy>('list')` next to `groupBy`. Thread through to `DashboardHeader` and `TabList`.                                                                                                                                                         |

No port surface changes. No manifest or permissions changes. `TabRow`, `Favicon`, `GroupChip`, `TabTitleLink`, `TabDomain`, `TabLastAccessedLabel`, `TabSelectCheckbox`, `TabCloseAction` are untouched.

### Tests

- **Unit** (`tests-small-unit/`):
  - `shared/lib/grouping.flat.test.ts` — Flat is a single bucket; intra-bucket sort by `lastAccessed` desc; ties broken by `id` asc; `dropEnabled: false`; `allowGrouping: true`; `sectionColorOf` returns `null`.
  - `dashboard/lib/layout.test.ts` — `layoutStrategyFor('list')` returns `ListLayout`; `layoutStrategyFor('grid')` returns `GridLayout`; each carries the right `key` and a `Body` component.
- **Integration** (`tests-medium-integration/dashboard/scan-all-tabs-in-a-grid.test.tsx`) — the outer ATDD test for this slice. User journey:
  1. Mount with a fixture spanning two windows, four domains, ten tabs total, with varied `lastAccessed` values.
  2. Default render: List + Window grouping. Assert the list renders.
  3. Switch grouping to Flat. Assert one section labeled `"All tabs · 10"`.
  4. Switch layout to Grid. Assert that an `<ul>` with grid class renders 10 `TabCard`s in `lastAccessed`-desc order.
  5. Click the first card → `tabsPort.focus` called with that tab id + window id.
  6. Click the close corner on a card → `tabsPort.closeMany` called with that one id.
  7. Select two cards → "Add to group ▾" → create new group → `tabsPort.createGroup` called with those ids (cross-window confirm fires since the fixture spans two windows; the test answers `OK`).

  This test stays red until every layer is wired.

- **Regression** — every existing list-layout test should keep passing untouched. List is the default, so any test that doesn't explicitly set `layoutBy` should still render rows.

`FakeTabsPort` already records every needed call; no new fakes. `window.confirm` stubbing reuses the pattern from the bulk-close and cross-window tests.

## Consequences

**Easier:**

- A glanceable scan of every open tab in one screen via Grid + Flat — the dashboard's reason for existing for users with 50+ tabs.
- Layout and grouping are now independent axes — future layouts (e.g. compact list, tree) plug into `LayoutStrategy` with no changes to grouping, and vice versa.
- The marquee combo (Grid + Flat) gets the full bulk-action toolbox for free — select-all, Add to group ▾, and the cross-window confirm from the previous slice all keep working.

**Harder:**

- Two presentational trees (rows and cards) now have to evolve in parallel for any future per-tab feature. Mitigated by the leaf components (`Favicon`, `GroupChip`, `TabTitleLink`, `TabDomain`, `TabLastAccessedLabel`, `TabSelectCheckbox`, `TabCloseAction`) being shared — only the container layout differs.
- Whole-card click as the focus affordance is a behavior change for users who memorized "click the title to switch tabs". Hover affordances aside, the entire row in List mode still focuses only on title click; that asymmetry is the price of grid usability.
- The grouping `materializeGroups` function now runs an extra map-per-bucket. For the three existing strategies it's an identity call; for Flat it's a sort. Cost is bounded by tab count.

**New constraints:**

- Any future grouping that wants a non-trivial intra-bucket sort must override `sortWithinBucket` instead of pre-sorting the input.
- Any future layout (e.g. compact list) implements `LayoutStrategy` and adds an option to `LayoutToggle`.
- `LayoutToggle` and `ViewToggle` should stay visually adjacent in `DashboardHeader` so the two axes read as one control group.

**Follow-up work parked, not done now:**

- Persisting layout + grouping choice across sessions via `chrome.storage` — pure ergonomics; backlog.
- Keyboard arrow-key navigation across grid cards — accessibility nice-to-have, separate slice.
- Tab thumbnails on cards — blocked by `chrome.tabs.captureVisibleTab` only capturing the active tab in the focused window. Not feasible without a different API.
- A density slider for the grid — YAGNI; the responsive auto-fill works for both narrow and wide windows.
- Reordering within a section via drag — out of scope today regardless of layout.
- Hover-reveal animations / polish — defer until Grid + Flat is shipped and used.

## Out of scope

- Changes to the search filter, intent inference, or selection persistence behaviour.
- Any changes to `TabRow`, `TabRowContainer`, or `TabGroupSectionTabs` beyond making `TabGroupSectionTabs` the `Body` of `ListLayout` (no rename, no internal change).
- Manifest, permissions, `ChromeTabsAdapter`, or `TabsPort` surface changes.
- A new `tests-big-e2e/` test for grid drag — list-layout drag is already covered by existing integration tests, and grid drag uses the same `draggable={isDraggable}` plumbing.
