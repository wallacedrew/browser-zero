# 0001. MV3 extension stack and feature-folded layout

- **Status**: accepted
- **Date**: 2026-05-10
- **Deciders**: wallace.drew (with Claude Code)

## Context

browser-zero needs to surface every Chrome tab across every Chrome window and (in later slices) close them. Chrome's `chrome.tabs.*` and `chrome.windows.*` APIs are the only practical source of this data — a CLI or web app cannot enumerate or mutate real Chrome tabs without launching Chrome with `--remote-debugging-port`, and even then only the debug session is visible. A Manifest V3 extension is the only realistic delivery shape.

We also have to commit to a layout convention before slice 2 (close one tab) and slice 3 (group by domain) bring more files. Two competing models exist: layer-folded (`src/core`/`shell`/`ui`) or feature-folded (`src/dashboard`, `src/shared`). The project sits under wallace.drew's shared `AGENTS-general.md` discipline, which mandates Screaming Architecture (feature-folded) with sibling test pyramid folders. The discipline doc wins (per the project's own `AGENTS.md` precedence rule).

## Decision

We will build browser-zero as a Manifest V3 extension with this stack, pinned in `package.json`:

- Vite 8 + `@crxjs/vite-plugin` (single config; HMR; manifest-aware bundling)
- React 19 + Tailwind CSS v4 via `@tailwindcss/vite` (CSS-first config — no `tailwind.config.ts` or `postcss.config.cjs`)
- TypeScript 6 strict + `noUncheckedIndexedAccess`
- Vitest 4 + React Testing Library + jsdom for the inner + middle test lanes; no automated E2E for slice 1
- ESLint 10 flat config + Prettier; Husky pre-commit `lint-staged → typecheck → test`

We will lay out `src/` feature-folded, with `dashboard/` (the slice 1 surface), `shared/` (lib + adapters), and `background/` (MV3 service worker — imperative shell). Tests live in sibling folders: `tests-small-unit/`, `tests-medium-integration/`, `tests-big-e2e/`.

We will treat Chrome's tab and window APIs as the only external system and will access them exclusively through a `TabsPort` interface, with `ChromeTabsAdapter` as the production implementation and `FakeTabsPort` as the test double. Slice 1 needs `queryAll` and `focus`; future slices extend the port just-in-time.

## Consequences

**Easier:**

- Slice 2 (close a tab) extends `TabsPort` with one method and one fake override — no UI restructuring.
- The dashboard test suite stays fast (~1s) because it never touches real Chrome.
- Future feature folders (e.g. `src/groups/` for slice 3) drop in next to `dashboard/` without restructuring `shared/`.

**Harder:**

- Tailwind v4 is recent enough that public examples often still assume v3's `tailwind.config.ts` + PostCSS plugin. We use the v4 CSS-first flow; future agents must not regress this.
- crxjs requires the dashboard HTML to be declared as a Rollup input in `vite.config.ts`'s `build.rollupOptions.input` so React + CSS get bundled; declaring it in `web_accessible_resources` alone leaves the HTML as a passthrough with a broken script tag.
- React 19's `react-hooks/purity` and `react-hooks/set-state-in-effect` rules require either a query library (TanStack Query, SWR) or documented eslint-disable comments for the load-on-mount pattern. We chose the latter for slice 1; we will revisit if slices 2+ accumulate more such effects.

**New constraints:**

- Every interaction with `chrome.*` must go through `TabsPort`. New Chrome APIs (sessions, windows beyond focus, action badges) require extending the port and the fake. No bypassing in components or hooks.
- `tests-medium-integration/_setup.ts` must keep RTL's `cleanup()` wired in `afterEach` because we keep `vitest.globals: false`.
