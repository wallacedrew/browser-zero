# Agent Instructions — browser-zero

> Project-specific instructions. Read together with `AGENTS-general.md`. Where they conflict, this file wins.

## Purpose

`browser-zero` is a Chrome Manifest V3 extension that surfaces every open tab across every Chrome window in a single dashboard, with title, URL, last-accessed time, and an inferred intent label. The first slice is read-only — listing only. Closing tabs (one-at-a-time, then bulk-by-domain) lands in later slices.

Distribution shape: load `dist/` unpacked from `chrome://extensions` during development. Published to the Chrome Web Store from v0.0.1 onwards — see `docs/store-listing.md` for the listing copy and permission justifications, and `docs/privacy-policy.md` (rendered at the GitHub Pages site) for the canonical privacy policy.

## Stack

- **Runtime**: Chrome Manifest V3 extension (background service worker + extension-page UI opened via `chrome.tabs.create`)
- **Language**: TypeScript (strict)
- **Build**: Vite + `@crxjs/vite-plugin`
- **UI**: React 19 + Tailwind CSS v4 (via `@tailwindcss/vite`; no `tailwind.config.ts` or `postcss.config.cjs` needed — config is CSS-first in v4)
- **Tests**: Vitest + React Testing Library (in-memory DOM)
- **Linter / formatter**: ESLint (flat config) + Prettier
- **Package manager**: pnpm

## Commands

```bash
pnpm dev            # Vite dev with HMR (watches manifest + sources; reload extension in chrome://extensions to pick up changes)
pnpm build          # Production build → dist/ (one-shot)
pnpm build:watch    # Production build → dist/ + watch for changes (keep dist/ alive while iterating)
pnpm test           # tests-small-unit/ + tests-medium-integration/ (fast lanes only)
pnpm test:e2e       # tests-big-e2e/ — none in slice 1; reserved
pnpm test:full      # all lanes
pnpm format         # Prettier — write
pnpm format:check   # Prettier — verify
pnpm typecheck      # tsc --noEmit
pnpm lint           # ESLint
```

Pre-commit hook (Husky): `format-write → typecheck → fast-test`. Any failure aborts the commit.

## Manual install (development)

1. `pnpm build`
2. Open `chrome://extensions`, enable Developer mode
3. "Load unpacked" → select `dist/`
4. Click the `browser-zero` toolbar icon → dashboard tab opens

After rebuilding, click the refresh icon on the extension card in `chrome://extensions` to pick up the new bundle.

### Avoiding the "Failed to load extension — File path cannot be resolved" error

`dist/` is gitignored, so it disappears between sessions (git clean, branch switches, manual cleanup, `rm -rf` chains during screenshot regens). When that happens Chrome's reload-on-card click shows "File path cannot be resolved". Two options:

- **One-shot**: `pnpm build`. Click Chrome's reload icon. Repeat per change.
- **Keep dist/ alive while iterating**: `pnpm build:watch` in a long-running terminal. Vite rebuilds `dist/` on every source save; you just click Chrome's reload icon to pick up the change. Stops cleaning between commits + screenshot regens since the watcher reproduces `dist/` immediately.

## Architecture

`browser-zero` reads and (later) mutates Chrome's tab state via the `chrome.tabs.*` and `chrome.windows.*` APIs. **Chrome is the only external system.** All access goes through `TabsPort` (interface) + `ChromeTabsAdapter` (real impl) + `FakeTabsPort` (test double). No other persistence, auth, or third-party services exist in slice 1.

### Layout

```
src/
  dashboard/                  ← the dashboard feature (slice 1 surface)
    components/               ← App, TabList, TabRow, IntentBadge (one per file)
    main.tsx                  ← entry point for the dashboard tab; wires ChromeTabsAdapter
    index.html                ← Vite HTML entry
    index.css                 ← Tailwind directives
  shared/                     ← what 2+ features will use (or will, by slice 2+)
    lib/                      ← pure functions: extractDomain, inferIntent, formatRelativeTime, types
    adapters/                 ← TabsPort interface; ChromeTabsAdapter real impl
  background/
    serviceWorker.ts          ← MV3 service worker; opens the dashboard on action click
manifest.json                  ← MV3 manifest
vite.config.ts                 ← @vitejs/plugin-react + @tailwindcss/vite + @crxjs/vite-plugin
tsconfig.json
eslint.config.js
.prettierrc.json
vitest.config.ts
```

**Imperative shell**: `src/dashboard/main.tsx` is the one place that imports `ChromeTabsAdapter` and injects it into `App`. `src/background/serviceWorker.ts` is the MV3 framework entry point — a one-line `chrome.tabs.create(getURL('dashboard/index.html'))` on action click.

**Tests**:

- `tests-small-unit/shared/lib/*` — microtests for pure functions (extractDomain, inferIntent, formatRelativeTime). Milliseconds.
- `tests-medium-integration/dashboard/*` — the slice 1 ATDD test mounts `App` with `FakeTabsPort` returning sample tabs and asserts the rendered list. ~1s. This is the **default home for new acceptance tests**, per `AGENTS-general.md`.
- `tests-big-e2e/` — not used in slice 1. Reserved for behaviours that genuinely need a real Chrome (e.g. validating `ChromeTabsAdapter` against the real API). For slice 1 the real-Chrome step is a single manual smoke check (see below).

**Manual smoke check** (supplements the automated ATDD test, does not replace it):

1. `pnpm build`; load `dist/` unpacked.
2. Have ≥2 Chrome windows and ≥10 tabs across ≥3 domains.
3. Click toolbar icon → dashboard tab opens; every tab listed; grouped by window; intent badges and relative times render; clicking a title focuses that tab.
4. Click Refresh → list reflects current Chrome state.

### Persistence schema

None in slice 1. The dashboard is stateless — every load fetches fresh from `chrome.tabs`.

## Current slice

**Slice 1** — read-only tab dashboard. See approved plan at `~/.claude/plans/this-application-will-be-cryptic-waffle.md`.

Out of scope until later slices: closing tabs (slice 2), grouping by domain + bulk close (slice 3), LLM-based intents, stale-tab detection, duplicate finder, search, undo, side panel.

## ADRs

`docs/architecture/` — populated when slice 1 commits. The first ADR (`0001-mv3-extension-stack-and-layout.md`) records the choice of MV3 + Vite + crxjs + React + Tailwind + Vitest + pnpm, plus the feature-folded layout and the `chrome.tabs.*`-behind-TabsPort rule. Written alongside the slice 1 commit per `AGENTS-general.md`.
