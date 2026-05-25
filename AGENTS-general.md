# Agent Instructions

> Shared instructions for all AI coding assistants (Claude Code, Codex, Copilot, Gemini).

---

## Project Kickoff Sequence

Applies to every project unless the user explicitly states otherwise. YAGNI strictly — no speculative scaffolding.

### Step 0 — Skeleton runs green

- `<run dev>` boots without errors
- `<run typecheck>` passes
- `<run test>` passes (empty suite)
- `<run lint>` and `<run format:check>` pass

That is **all** Step 0 does. No ports, fakes, schema, adapters, or registries. CI wiring (pre-commit hooks, baseline scripts, formatter config) lives here if needed.

### Step 1+ — Vertical user-behavior slices, one at a time

Each slice ships one user-visible behavior end-to-end, ATDD-first, with full test coverage at the appropriate pyramid layer.

**First slice is always a tracer bullet** — smallest user-visible behavior that proves the stack is alive — unless the user explicitly states otherwise.

A slice is:
- **Vertical** — touches every layer the behavior requires. No layer built in isolation or ahead of need.
- **User-behavior-driven** — named for what the user does or notices in domain language ("Log a meal", "Send a tweet"). Not "wire up the database" or "scaffold adapters".
- **Minimum coherent behavior** — fewest decisions, fewest screens, fewest validations. Polish and edge cases ship in later slices.
- **ATDD-driven** — failing acceptance test written first; stays red until the slice goes end-to-end green. Inner microtests drive each unit of logic.

### Universal invariant — no external system without a port

**Non-negotiable.** Every interaction with an external system goes through a port (TypeScript interface or equivalent) and a corresponding adapter or gateway. Zero exceptions.

External systems include: persistence, HTTP APIs, LLM providers, message buses, payment providers, identity providers, file systems beyond static assets, the system clock (when behavior depends on time), and randomness (when behavior depends on it).

First time a slice introduces a new external system:
1. Define the port (interface) under the owning feature folder, sized to only what this slice needs.
2. Provide an in-memory `Fake*` test double that records calls.
3. Implement the real adapter or gateway (only the methods the slice exercises).
4. Wire the registry to throw on unknown keys.

Subsequent slices reuse existing ports; only new external systems repeat this dance. **Ports grow incrementally — no interface carries a method no slice has shipped.**

### Never build a layer in isolation

Forbidden patterns: "first I'll build out the data model", "wire up auth before features", "scaffold all the adapters". These create dead code and rework when the slice reveals the layer's shape was wrong. Every layer change ships inside the slice that needs it.

### What the user must confirm at kickoff

- The first tracer-bullet behavior (if not obvious from the plan).
- Any deviation from this sequence.

---

## Framework Version Warning

The framework, language, and library versions in this repo are **NOT** necessarily the ones you were trained on. Before writing any code that touches a framework or library:

1. Check the version in the manifest (`package.json`, `pyproject.toml`, `go.mod`, etc.).
2. Read docs for that exact version.
3. Heed deprecation notices.

Pattern-matching to training data without verification is the most common source of subtle regressions. Read first, then write.

---

## Commands

```bash
<run dev>            # Dev / watch mode
<run build>          # Production build
<run test>           # Fast suite (unit + integration); excludes slow lanes
<run test:perf>      # Perf-budget tests only
<run test:e2e>       # Full-browser or full-stack E2E tests
<run test:full>      # All lanes
<run format>         # Formatter — write
<run format:check>   # Formatter — verify
<run typecheck>      # Type checker, no emit
<run lint>           # Linter
```

Wire a pre-commit hook: **format-write → typecheck → fast-test suite** in that order. Any failure aborts the commit. Bypass (`--no-verify`) only when truly necessary.

Perf and load tests belong in their own lane, excluded from the default fast suite. Use directory location — not filename suffix — as the lane discriminator.

Visual verification: maintain a small script that drives a real browser through user-facing surfaces and writes screenshots to a throwaway location (e.g. `/tmp/snap/`). Support a mobile-viewport flag. Run before declaring any layout or spacing change done. Don't commit output. Skip for headless services and bots.

---

## Architecture

State the system's purpose in 1–2 sentences and the persistence and authentication strategy concisely. Name every runtime-swappable interface (storage backends, payment providers, auth, AI vendors, social platform clients) and identify the swap point.

### Layout

`src/` is fully feature-folded (Screaming Architecture). Top-level folders are domain features plus `shared/` for what 2+ features use. Each feature folder owns whichever subdirs it needs: `components/`, `hooks/`, `lib/`, `adapters/`, `api/`.

**Feature folders:** list them; for each, name the components, hooks, lib modules, adapters, and API handlers it owns.

**Shared folder:** generic UI primitives, value objects, cross-cutting types, server gateways, top-level lib utilities that 2+ features genuinely use. Not a dumping ground for feature-specific code.

**Imperative shell:**
- Top-level mount file — owns adapter selection and state sync.
- Framework-required entry points — one-line shims that re-export the real handler from the feature folder.

**Test sibling folders** (mirror feature shape):
- `tests-small-unit/<feature>/{lib,adapters,hooks,api,...}/*` — milliseconds, isolated. Perf-budget tests live here as `*.perf.*`, excluded from the default fast suite.
- `tests-medium-integration/<feature>/*` — ~1s, in-memory environment. Mounts the top-level shell end-to-end; stubs network/auth/persistence via shared fakes. Default home for new acceptance tests.
- `tests-big-e2e/<feature>/*` — full browser or full-stack against real external systems. Reserved for behaviors that genuinely need it (drag, multi-context isolation, real OAuth, sandbox API contract tests). `tests-big-e2e/cross-cutting/` for cross-feature invariants.

### Persistence schema

Document every persistence key, table, or document shape the app reads and writes, with exact types. Note namespacing, legacy migration forms, derived value formulas, and where constants live.

---

## Architecture Decision Records (ADRs)

### When required

- Introduces, replaces, or removes an external system.
- Establishes or revises the layout convention.
- Adopts or drops a major framework, runtime, or library that shapes how the codebase is written.
- Changes the deployment shape.
- Establishes or revises a cross-cutting pattern documented in this file.
- Locks in a trade-off that cannot be easily reversed across many slices.

### When not required

Bug fixes, local refactorings, feature work built on established architecture, adding a port/adapter following an existing pattern, Tidy First commits, doc/style/linter changes.

### Location and naming

`docs/architecture/` at repo root. Flat folder. `NNNN-kebab-case-title.md` — zero-padded sequential, immutable, never reused. `docs/architecture/INDEX.md` lists every ADR (chronological order, title, status, one-line summary).

### Template

```
# NNNN. Title

- **Status**: proposed | accepted | deprecated | superseded by ADR-NNNN
- **Date**: YYYY-MM-DD
- **Deciders**: names or roles

## Context
What forced the decision? Specific forces in play.

## Decision
Active voice ("We will use X"). Specific enough to implement without follow-up questions.

## Consequences
What becomes easier. What becomes harder. New constraints. Follow-up work. Both sides of the ledger.
```

### Conventions

- Write the ADR alongside the implementing change — same branch, ideally same commit.
- ADRs are immutable once accepted. Revisit by writing a new ADR that supersedes the old one; old ADR stays, index reflects its status.
- When AGENTS sections or inline comments depend on an ADR's reasoning, link by number (`see ADR-0007`).
- Keep ADRs short. Two well-named pages beat ten of exhaustive prose.

---

## Design Principles

- **Domain language** — name things after the domain, not implementation details. Maintain `docs/glossary.md`; use terms exactly as written; no synonyms or abbreviations.
- **Vertical slicing** — one complete feature top-to-bottom before starting the next. (See Kickoff Sequence.)
- **Composed functions in view files** — pure helpers at module level; helpers that close over component state stay inside the component.
- **Default to OOP outside view files** — in `lib/` or `adapters/` (value objects, registries, services with state + behavior), use classes. Value objects and registries are canonical examples. Plain functions remain right for pure transforms and parsers. Component-framework idioms (functional components, hooks) stay functions — that's the framework's shape.
- **Composition over inheritance** — default to composing collaborator objects. Prefer _has-a_ over _is-a_. Reach for `extends` only when behavior genuinely varies across subclasses; even then, Strategy via composition usually wins.
- **One component or class or interface per file** — every component in its own file under the owning feature's `components/`. No sub-components defined inside a parent file. Same rule for hooks, classes under `lib/` or `adapters/`. Interfaces tightly bound to one class co-locate; everything else gets its own file. File > ~120 lines = same violation as inline sub-component — extract before continuing.
- **Compose JSX from named primitives** — repeated structural patterns in a render become small named components. Parent reads as a list of named primitives, not a wall of style props.
- **Module size guardrail** — presentational component file should not exceed ~120 lines or host more than two state-kind/mode-dependent render branches. Extraction signals (in order of strength):
    1. Repeated `state.kind === "X"` branches in one render tree.
    2. Three or more orthogonal concerns in one file.
    3. More than two module-level style constants.
       When any fire, extract before adding code. Pattern: named export, `interface Props` above component, style constants above that, named handlers above the return.
- **Named event handlers over inline arrows** — handlers with any logic (conditionals, multiple statements, sanitization) get named functions declared in the component. `onKeyDown={handleKeyDown}`, not `onKeyDown={(e) => { ... }}`. Trivial single-call passthroughs may stay inline.
- **No bare compound conditionals** — any boolean expression with 2+ clauses or any non-trivial ternary deserves a name.
    - Extract a named `const` with a domain-meaning name when local to one component.
    - Encapsulate as a method or accessor on the source when the same predicate is asked in more than one place.
      Inline state-shape checks at call sites couple every consumer to the source's representation. When you write `someObject.state.kind === "X"` inline in a render, effect dep array, or prop — stop, name it or push it onto the source.
- **No naked casts across trust boundaries** — any value entering from outside (`JSON.parse`, HTTP responses, key-value store reads, LLM output, JWT decode, third-party SDK returns) must pass through a hand-rolled `parse(raw: unknown): TypedShape` validator. `as Foo` on these results is banned. Small parsers live with their consumer; larger parsers sit beside the type they produce.
- **No silent failures at integration seams** — every adapter or boundary `catch` block does exactly one of: (a) propagate to caller, (b) surface via the app's error channel, (c) record telemetry with diagnostic detail. Bare log satisfies none. Returning success from a failed write is the most dangerous variant — propagate when in doubt.
- **Guard clauses are visually isolated** — single-line early-return guards get a blank line above and below. Apply at write-time.
- **Functional core / imperative shell** — pure calculations in `lib/`; storage, network, time, and randomness at the shell (top-level mount, `adapters/`, API handler files).
- **Screaming Architecture** — `src/` organized by feature, not framework layer. Directory tree answers "what does this app do" before "what stack". Framework-required entry points stay where the framework demands but are one-line shims re-exporting the real handler from the feature folder. New work for any feature lands in `src/<feature>/` and tests in `tests-*/<feature>/`. `src/shared/` only for what 2+ features genuinely use.
- **Humble Object Pattern** — when code is hard to test because it's coupled to a framework boundary, make the boundary as humble as possible: pull all logic into a plain object with no framework dependency, unit-test that object, the shell only delegates. If the shell is so thin a test would be redundant, that's the goal.
- **Separate view from logic** — render surfaces are dumb output mechanisms. They don't decide, query, format, or branch on domain state. Refuse or refactor on sight: non-trivial conditionals in a render, method chains walking domain objects (`a.b.c.d`), data-shaping calls (sort/filter/map-with-logic) in a render, conditional rendering driven by inspecting domain object state rather than reading a named boolean off a view model.
- **View Model Pattern** — a view never receives a domain entity. It receives a view model: a plain object shaped to that view's exact needs — pre-formatted strings, derived booleans (`showsEmpty`, `canEdit`), pre-sorted collections, pre-resolved URLs. Computed in a hook, presenter, or use case — never in the template, never in a helper called from render. One view, one view model; don't share view models across unrelated views.
- **Integration naming: Adapter vs Gateway** — use these terms precisely; no `*Client`, `*Service`, `*Manager` catch-alls.
    - **`*Adapter`** — implements an internal interface (port) so a backend can be swapped at runtime. Multiple implementations of one persistence or messaging interface are the canonical example.
    - **`*Gateway`** — encapsulates all access to a specific external system and owns the wire format. Holds request shaping, network call, response parsing, and boundary validator; exposes a clean typed interface returning domain types.
    - **Anti-Corruption Layer** — a Gateway plus translation between two different domain models. Don't add speculatively; only when a third-party model doesn't match yours.
- **Intention-revealing names** — no abbreviations or single-letter variables; name everything after what it represents in the domain.
- **Explicit types** — annotate every variable, parameter, and return value where the language allows; no implicit `any`.

---

## Tidy First Discipline

> "For each desired change, make the change easy (warning: this may be hard), then make the easy change." — Kent Beck

**Structural changes and behavioral changes belong in separate commits.**

A **behavioral change** alters what the code computes. A **tidying** is a tiny structural change — guard clauses, dead code removal, reading order, normalizing symmetric branches, naming a compound conditional, extracting a helper — that does not alter behavior.

Rules:

1. **Make the change easy first, then make the easy change.** When a behavior change feels hard, stop. Ask: what tidying makes this trivial? Commit that tidying alone. Then make the now-trivial behavior change. Resistance is signal the structure is fighting you.
2. **One commit, one kind of change.** Never mix structural and behavioral edits. Agents in particular tend to "improve" unrelated code while implementing a feature — refuse this.
3. **Tidy first by default; tidy after when the right shape only emerges from doing the work; tidy never when the code is fine.** Tidying is investment; without expected return it is waste.
4. **Tidyings are small.** Extract a named const, isolate a guard clause, delete dead code, fix reading order, normalize two near-identical branches. Each one is individually green-tested before the next.
5. **Know when to stop.** One tidying always reveals another. Bound the cleanup so the behavior change ships.
6. **Tidying commits state their value with a short before/after.** Every refactoring or preparatory-tidying commit message includes a `Before:` / `After:` / `Value:` block in the body. Subject line: `refactor: <what>`. Example:

   ```
   refactor: extract handleKeyDown from <Component> onKeyDown

   Before: inline arrow with three branches in a render prop, untestable.
   After:  named `handleKeyDown` declared above the return.
   Value:  matches "Named event handlers over inline arrows"; handler is now unit-testable.
   ```

   Every future agent that opens this repo reads `git log` to orient before editing. The `Value:` line tells that agent which patterns are deliberate and load-bearing. Without it the agent sees only the diff and may undo a careful tidying or skip a structural setup the next behavior change relies on.

Behavior commits don't need this block; the user-visible change is its own justification.

Tidy First and Vertical Slicing are orthogonal: slicing scopes the feature; Tidy First scopes the commit sequence within a slice.

---

## Testing Workflow

### End-to-end features — double loop (ATDD–TDD)

1. **Outer loop (ATDD)** — write one failing acceptance test for the complete user-visible behavior before touching any implementation. Default: integration test in `tests-medium-integration/<feature>/`. Escalate to `tests-big-e2e/<feature>/` only when the behavior genuinely requires it.
2. **Inner loop (TDD)** — drive each unit of logic: failing microtest → minimal passing code → refactor.
3. Feature done only when the outer ATDD test goes green.

### Unit features — TDD loop

Failing microtest → minimal passing code → refactor. Done when microtests are green and behavior matches the spec.

### Test pyramid

Push tests as far down as possible.

1. **Unit** (`tests-small-unit/<feature>/{lib,adapters,hooks,api,...}/*`) — pure functions, value objects, adapters in isolation. Milliseconds. Perf-budget tests live here as `*.perf.*`, excluded from the default fast suite.
2. **Integration** (`tests-medium-integration/<feature>/*`) — mounts top-level shell end-to-end in-memory; stubs via shared fakes. ~1s per spec. Default home for new acceptance tests.
3. **E2E** (`tests-big-e2e/<feature>/*`) — full browser or full-stack against real external systems. Reserve for behaviors that genuinely need it. `tests-big-e2e/cross-cutting/` for cross-feature invariants.

### Naming

Integration and E2E spec files are named for user journeys in domain language. Examples: `send-a-tweet`, `log-some-food`, `adjust-an-entry`. Forbidden: `search.spec.*`, `crud.spec.*`, `database.spec.*`. Each test describes something a user does or notices — not what the implementation does internally. If a test cannot be phrased as user-visible behavior, it belongs at the unit level.

**Tests are immutable** — never modify an existing test to make code pass; fix the implementation instead.