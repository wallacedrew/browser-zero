# Agent Instructions

> Shared instructions for all AI coding assistants (Claude Code, Codex, Copilot, Gemini).

## Project Kickoff Sequence

This is the order of operations every time a project moves from planning into execution. It applies to **every new project unless the user explicitly states otherwise** — not just this one. Apply YAGNI strictly: no big design up front, no speculative ports, no "we'll need this later" scaffolding.

### Step 0 — Skeleton runs green (that's it)

Before any feature work, the project skeleton must boot and the test/typecheck pipeline must be green:

- `<run dev>` boots without errors
- `<run typecheck>` passes
- `<run test>` passes against an empty test suite
- `<run lint>` and `<run format:check>` pass

That is **all** Step 0 does. No domain ports. No fakes. No schema. No adapters. No registry. The skeleton is bare. Standing up port surface for external systems we haven't decided to touch yet is BDUF — explicitly forbidden.

If the project needs a CI-equivalent step (pre-commit hook wiring, baseline `package.json` scripts, formatter config), it lives here too. Otherwise Step 0 is short.

### Step 1+ — Vertical user-behavior-driven slices, one at a time

After Step 0, the project advances exclusively in **vertical user-behavior-driven slices**. Each slice ships one user-visible behavior end-to-end through every layer it requires, ATDD-first, with full test coverage at the appropriate pyramid layer. **The first slice is always a tracer bullet** — the smallest user-visible behavior that proves the stack is alive — unless the user explicitly states otherwise.

A slice is:

- **Vertical** — touches every layer the slice's behavior actually requires (auth → route → use case → port → adapter → external system → persistence → response). No layer is built in isolation; no layer is built ahead of need.
- **User-behavior-driven** — named for what the user _does or notices_, in domain language. "Send a tweet." "Log a meal." "Run a query." Not "wire up the database" or "implement the API."
- **The smallest behavior that's coherent** — for the tracer bullet, pick the one with the fewest decisions, fewest screens, fewest validations. Polish, edge cases, error handling, and UI affordances come in later slices. Subsequent slices follow the same minimum-viable shape.
- **ATDD-driven** — the failing acceptance test (integration-tier; in-memory DOM + RTL for UI projects, in-memory adapter against the relevant fakes for headless services and bots) is written first and stays red until the slice goes end-to-end green. Inner microtests drive each unit of logic per the `tdd` skill.

### Universal invariant — no external system without a port

This rule is non-negotiable and applies to every slice from Slice 1 onward:

> **No external system is ever touched directly. Every interaction with an external system goes through a port (TypeScript interface or equivalent) and a corresponding adapter or gateway. There are zero exceptions.**

External systems include: persistence (database, key-value store, blob store), HTTP APIs (third-party platforms, internal microservices), LLM providers, message buses and queues, payment providers, identity providers, file systems beyond the project's own static assets, the system clock when behavior depends on time, randomness when behavior depends on it.

The first time a slice introduces interaction with an external system that doesn't yet have a port, the slice is responsible for:

1. Defining the port (interface) under the owning feature folder, sized to _only_ what this slice needs. Don't pre-declare optional methods for behaviors no slice has asked for yet — extend the interface in the slice that actually needs the new method.
2. Providing an in-memory `Fake*` test double that records calls, for unit tests to drive domain logic without real I/O.
3. Implementing the real adapter or gateway behind the port. Only the methods the slice exercises need real implementations; methods reserved for future slices either don't exist on the interface yet (preferred) or throw `NotImplementedError` (acceptable when keeping the interface stable matters).
4. Wiring the registry — if the architecture has one (`adapterFor(platform)`, `repositoryFor(entity)`, etc.) — to throw on unknown keys, so future adapters drop in without changing call sites.

Subsequent slices that touch the same external system reuse the existing port. Slices that introduce new external systems repeat this dance for each new one. **Ports grow incrementally; the codebase never carries an interface for a behavior no slice has shipped.**

The Adapter vs Gateway distinction in **Design Principles** below answers _what to name the wrapper_; this section answers _when and how to introduce one_. Both apply.

### Never build a layer in isolation

Forbidden phrasings, recognizable on sight: "first I'll build out the data model", "wire up auth before features", "scaffold all the adapters", "add the dashboard then add features". Each of these creates dead code, false confidence, and rework when the slice that finally calls into the layer reveals the layer's shape was wrong. Every layer change ships inside the slice that needs it, justified by user-visible behavior moving forward.

### What the user has to confirm at kickoff

- The first tracer-bullet behavior, if not obvious from the plan. (For most apps: the canonical core action — send, post, log, save, run.)
- Any deviation from this sequence. ("Skip Step 0, I just want to spike X" is valid; agents must not infer it.)

Anything else — order of remaining slices, port shapes, adapter choices — comes from the plan and emerges slice by slice.

---

The Kickoff Sequence above governs **how work flows in**: Step 0, then slices, never a layer in isolation, never an external system without a port. Everything below governs **how work is shaped within each slice**: the framework hygiene, the design principles, the commit discipline, the testing pyramid. Kickoff and standing discipline are orthogonal — every slice from #1 onward is bound by both.

## Framework Version Warning

The framework, language, and library versions in this repo are NOT necessarily the ones you were trained on. APIs, conventions, idioms, and file structure may all differ from your defaults. Before writing any code that touches a framework or library:

1. Check the version pinned in the manifest (`package.json`, `pyproject.toml`, `Gemfile.lock`, `go.mod`, etc.).
2. Read the relevant documentation for that exact version (vendored docs in `node_modules/<pkg>/dist/docs/` or equivalent, official docs filtered to that version, or the changelog).
3. Heed deprecation notices.

Pattern-matching to your training data without verification is the most common source of subtle regressions in this repo. Read first, then write.

## Commands

Document every routine the team and agents will actually run. The point is that an agent landing in this repo cold can verify its work without guessing.

```bash
<run dev>            # Dev / watch mode
<run build>          # Production build
<run test>           # Default fast test suite (unit + integration); excludes slow lanes
<run test:perf>      # Perf-budget tests only; not run by default test
<run test:e2e>       # Full-browser or full-stack end-to-end tests
<run test:full>      # All lanes together
<run format>         # Formatter — write
<run format:check>   # Formatter — verify
<run typecheck>      # Type checker, no emit
<run lint>           # Linter
```

Wire a pre-commit hook that runs **format-write → typecheck → fast-test suite** in that order on every commit. The typecheck step catches type drift the build graph wouldn't see (e.g. third-party SDK wrapper types that slip past unit tests and only break on a clean production build). Any failure aborts the commit. Bypass (e.g. `--no-verify`) only when truly necessary, and never as a routine workaround.

**Perf and load tests** belong in their own lane, excluded from the default fast suite. They assert wall-clock latency ceilings and flake under the machine load that the formatter and typechecker leave behind in a pre-commit run. Run them on demand or as part of the full suite. Use directory location — not a filename suffix — as the lane discriminator wherever the test runner supports it; the location _is_ the metadata.

**Visual verification** complements the test pyramid; it is not part of it. JSDOM-style headless DOM environments return zeros from `getBoundingClientRect()`, so spacing, alignment, viewport-fit, and "above the fold" all slip past the default test run. Maintain a small script that drives a real browser through the user-facing surfaces (landing → signup → login or equivalent) and writes screenshots to a throwaway location (e.g. `/tmp/snap/`). Support a mobile-viewport flag. Run it before declaring any layout or spacing change done. Agents working in the repo can read the resulting images back to self-verify visual changes. Don't commit the output. Add new visual surfaces by extending the navigation script directly — no new file convention. (Skip this section entirely for headless services and bots — there's no UI to screenshot.)

## Architecture

State the system's purpose in one or two sentences and the persistence and authentication strategy concisely. Whatever sits behind a runtime-swappable interface (storage backends, payment providers, auth providers, AI vendors, social platform clients) gets named explicitly here, with the swap point identified.

### Layout

`src/` is fully feature-folded (Screaming Architecture; see Design Principles). Top-level folders are domain features plus a `shared/` folder for what 2+ features use. Each feature folder owns whichever subdirs it needs: `components/`, `hooks/`, `lib/`, `adapters/`, `api/`.

**Feature folders:** list them. For each, name the components, hooks, lib modules, adapters, and API handlers it owns. Be specific. The point of this section is that an agent can pick the right folder for a new file without inferring from filenames.

**Shared folder:** what 2+ features genuinely use — generic UI primitives, value objects, cross-cutting types, server gateways, top-level lib utilities. `shared/` is **not** the new dumping ground for "components/"; it is for what is actually shared.

**Imperative shell:**

- Top-level mount file — owns adapter selection and state sync
- Framework-required entry points (route handlers, `main`, etc.) — one-line shims that re-export the real handler from the feature folder

**Tests** are sibling folders of `src/`, named for their pyramid layer:

- `tests-small-unit/<feature>/{lib,adapters,hooks,api,...}/*` — milliseconds, isolated. Mirror src subdirs down to the file. Perf-budget tests live here too as `*.perf.*` and are excluded from the default fast suite.
- `tests-medium-integration/<feature>/*` — ~1s, in-memory environment (DOM + RTL for UI projects, in-memory adapters against the relevant fakes for headless services and bots). Flat at the feature level. Each spec mounts the top-level shell end-to-end and stubs network / auth / persistence via a shared helper. The default home for new acceptance tests.
- `tests-big-e2e/<feature>/*` — full browser or full-stack against real external systems. Reserved for behaviours that genuinely need one (drag, multi-context isolation, real OAuth handshakes, sandbox API contract tests). Shared infrastructure (global setup, stubs) lives at the lane root. A `tests-big-e2e/cross-cutting/` folder holds invariant specs that don't belong to any single feature (e.g. data isolation between users across the whole app).

### Persistence schema

Document every persistence key, table, or document shape the app reads and writes, with exact types. If keys are namespaced or migrated from a legacy form, say so. If derived values are computed at known points (unit conversions, currency math, denormalization), document the formula and where the constants live.

## Architecture Decision Records (ADRs)

When a change affects system design, high-level architecture, or the codebase's large-scale structure, write an ADR alongside the code and commit it under `docs/architecture/` at the repo root. ADRs are the long-form companion to the `Before:` / `After:` / `Value:` block on Tidy First commits: the commit body explains why a single tidying-commit looks the way it does; an ADR explains why the architecture itself does.

### When an ADR is required

Trigger an ADR when the change does any of:

- Introduces, replaces, or removes an external system the codebase reaches into (persistence backend, auth provider, payment provider, message bus, AI vendor, third-party API).
- Establishes or revises the layout convention (feature-folded vs layer-folded `src/`, monorepo boundaries, package split, sibling test-folder shape).
- Adopts or drops a major framework, runtime, or library that shapes how the codebase is written (state management, ORM, routing, language runtime, build tool).
- Changes the deployment shape (region count, runtime kind, edge vs node, containerized vs serverless).
- Establishes or revises a cross-cutting pattern documented in this file (testing pyramid, error-surface contract, value-object discipline, integration naming, port/adapter rules, vertical-slice invariant).
- Locks in a trade-off that future-us cannot easily reverse without coordinated work across many slices.

### When an ADR is not required

- Bug fixes, local refactorings, and feature work built on the established architecture.
- Adding a port, adapter, or gateway that follows an existing pattern — that's slice work, not architecture work.
- Tidy First commits — the `Before:` / `After:` / `Value:` block already records the rationale at the right granularity.
- Documentation, copy, styling, formatter, or linter changes that don't shift structure.

### Where ADRs live

- `docs/architecture/` at the repo root. Flat folder; no nesting.
- One ADR per file. Filename: `NNNN-kebab-case-title.md` with `NNNN` a zero-padded sequential number (`0001-...`, `0002-...`). Numbers are immutable and never reused, even after an ADR is superseded.
- `docs/architecture/INDEX.md` lists every ADR in chronological order with title, status, and a one-line summary, so an agent landing in the repo cold can orient on a single page.

### ADR template

```
# NNNN. Title in plain English

- **Status**: proposed | accepted | deprecated | superseded by ADR-NNNN
- **Date**: YYYY-MM-DD
- **Deciders**: who weighed in (names, roles, or "<team>")

## Context

What forced the decision? Constraint, incident, deadline, stakeholder ask, technical limitation. Be specific about the forces in play — future-us is reading this to reconstruct why the obvious-in-retrospect choice wasn't obvious at the time.

## Decision

Active voice ("We will use X"), not recommendation ("X is recommended"). Specific enough that another engineer can implement to it without asking follow-up questions.

## Consequences

What becomes easier. What becomes harder. What new constraints this imposes on future slices. What follow-up work this creates. Both sides of the ledger — pretending an architectural choice is pure upside is the most reliable way to lose its rationale within a quarter.
```

### Conventions

- Write the ADR **alongside** the change that implements it — same branch, ideally same commit. Reviewers see the why and the what together.
- Once accepted, ADRs are immutable. Revisiting a decision means writing a new ADR that supersedes the old one (`Status: superseded by ADR-NNNN`), not rewriting history. The old ADR stays in place; the index reflects its status.
- When AGENTS sections, commit bodies, or inline comments depend on an ADR's reasoning, link by number (`see ADR-0007`). The rationale is then one click away from every place that's load-bearing on it.
- Keep ADRs short. Two pages of well-named sections beat ten of exhaustive prose. If you can't compress the decision, the decision isn't ready — keep iterating on the draft until you can.

## Design Principles

- **Domain language** — name things after the domain, not implementation details. Maintain a glossary (e.g. `docs/glossary.md`) of canonical terms; use them exactly as written; do not invent synonyms or abbreviations.
- **Vertical slicing** — build one complete feature at a time through all layers before starting the next. (See Project Kickoff Sequence above for the operating mode this principle implies.)
- **Composed functions in view files** — pure helpers go at module level; helpers that close over component state stay inside the component.
- **Default to OOP outside view files** — in any feature's `lib/` or `adapters/` (value objects with invariants, registries, services with state + behaviour), reach for classes that compose data + methods. Value objects (money, dates, quantities, identifiers) and registries are canonical examples; their view-layer consumers stay functional. Plain functions remain the right tool for pure transforms and parsers. Component-framework idioms (functional components, hooks) keep using functions — that's the framework's shape, not a contradiction.
- **Composition over inheritance** — when modeling with classes, default to composing collaborator objects rather than building inheritance hierarchies. Prefer _has-a_ over _is-a_; wrap a `Map` rather than `extends Map`. Subclasses that only set static fields are a smell — collapse to one class composing a descriptor. Reach for `extends` only when behaviour genuinely varies across subclasses; even then, Strategy via composition usually beats `extends`. In statically-typed languages with structural typing or discriminated unions, inheritance is rarely the right tool.
- **One component or class or interface per file** — every component lives in its own file under the owning feature's `components/`, alongside the helper constants, types, or functions only it uses. Don't define sub-components inside a parent component file; extract them. Same rule for custom hooks and for every named class under any `lib/` or `adapters/`. Interfaces and types tightly bound to a single class co-locate with that class; everything else gets its own file. If a single component or class or interface file grows past ~120 lines, treat it as the same violation as defining a sub-component inline — extract before continuing.
- **Compose JSX (or templates) from named primitives** — when a render function contains repeated structural patterns (e.g. four near-identical typography calls), extract each repetition into a small named component. The parent should read as a list of named primitives rather than a wall of style props. Combined with "One component per file", small primitives become first-class building blocks.
- **Module size guardrail** — a presentational component file should not exceed ~120 lines and should not host more than two distinct state-kind / mode-dependent render branches. Line count is a smell, not a law — it's the trigger to ask whether the render is hiding a state machine. Concrete extraction signals, in order of strength:
  1. **Repeated `state.kind === "X"` branches** in one render tree — each branch wants its own component.
  2. **Three or more orthogonal concerns** in one file (e.g. input handling + dropdown rendering + form rendering, or click-outside + keyboard nav + scroll-into-view) — each concern is a candidate component or hook.
  3. **More than two module-level style constants** — usually one component is wearing multiple hats.

  When any of these fire, stop adding code and extract first. Use a consistent pattern: named export, `interface Props` above the component, style constants above that, named handlers above the render.

- **Named event handlers over inline arrows** — handlers with any logic (conditionals, multiple statements, sanitization) get extracted to a named function declared in the component, not inlined as an arrow. `onKeyDown={(e) => { if (e.key === "Enter") commit(); }}` becomes `onKeyDown={handleKeyDown}` with the function above the return. Trivial single-call passthroughs can stay inline.
- **No bare compound conditionals** — any boolean expression with two or more clauses (`a && b`, `a || b`, `state.kind === "X" || state.kind === "Y"`) and any non-trivial ternary deserves a name. Two ways to fix:
  1. **Extract a named const** with a domain-meaning name when the condition is local to one component (e.g. `const showsEmpty = state.kind === "showingResults" && !state.loading && state.results.length === 0`).
  2. **Encapsulate as a method or accessor on the source** when the same predicate is asked of the same object in more than one place. The condition belongs on the hook, value object, or service that owns the state — not duplicated at every call site.

  Trigger: when you write `someObject.state.kind === "X"` (or any discriminated-union check) inline in a render, an effect dep array, or a prop, stop. If it's local, name it. If it's shared, push it onto the source. Inline state-shape checks at call sites couple every consumer to the source's representation and silently duplicate as the codebase grows.

- **No naked casts across trust boundaries** — any value entering the system from outside (`JSON.parse`, HTTP response bodies, key-value store reads, LLM output, JWT decode, third-party SDK return types) must pass through a hand-rolled `parse(raw: unknown): TypedShape` validator that field-checks the shape and rejects on drift. `as Foo` (or its language equivalent) on these results is banned. Small parsers live with their consumer; larger parsers sit beside the type they produce.
- **No silent failures at integration seams** — every adapter or boundary `catch` block does exactly one of: (a) propagate the error to the caller, (b) surface it via the app's user-facing error channel, or (c) record telemetry with diagnostic detail. A bare log statement satisfies none of those. Returning success from a failed write — masking the failure — is the most dangerous variant: a swallow-and-log catch can let a write-through cache hold stale data and hide the problem from the next read. When in doubt, propagate.
- **Guard clauses are visually isolated** — single-line early-return guards (`if (!cond) return;`, `if (state.kind !== "X") return null;`) get a blank line above and below so the eye picks them out as preconditions, not as part of the surrounding flow. Multi-line guard blocks that already use braces follow the same convention. Convention-only — formatters and linters can't target guard clauses without false positives, so apply this at write-time and call it out in review.
- **Functional core / imperative shell** — pure calculations in any feature's `lib/`; storage, network, time, and randomness at the shell (top-level mount, the feature's `adapters/`, API handler files).
- **Screaming Architecture** — `src/` is organized by feature, not by framework layer. The directory tree answers "what does this app do" before "what stack is it built on". Each feature folder owns whichever subdirs it needs: `components/`, `hooks/`, `lib/`, `adapters/`, `api/`. Anything used by 2+ features lives under `src/shared/`.
  - **Framework-required entry points** (route files, controllers, etc.) stay where the framework demands but are one-line shims that re-export the real handler from the feature folder. The framework routing stays satisfied; the feature folder owns the behaviour.
  - **Tests are siblings of `src/`**, named for their pyramid layer, each mirroring the feature shape (see Layout above and Testing Workflow below).
  - **New work for any feature MUST land in `src/<feature>/`** and its tests in the corresponding `tests-*/<feature>/`. Adding a brand-new feature: create `src/<new-feature>/` directly with whatever subdirs it needs. Don't drop new code into `src/shared/` for code that's actually feature-specific — `shared/` is for what 2+ features genuinely use.
- **Humble Object Pattern** — when code is hard to test because it's coupled to a framework boundary (a render surface, a controller, an async callback, a third-party SDK, a job runner, an event handler), make the boundary as humble as possible: pull all logic into a plain object with no framework dependency, then unit-test that object. The humble shell only delegates. The top-level mount is the humble shell for storage; pure logic lives in feature `lib/` modules. Components are humble shells for rendering; their decisions come from hooks and view models. If the humble shell is so thin a test would be redundant, that's the goal — not a smell.
- **Separate view from logic** — render surfaces are dumb output mechanisms. They don't decide, query, format, or branch on domain state. A view reads pre-prepared values and iterates pre-prepared collections; nothing more. Signals to refuse or refactor on sight: any non-trivial conditional inside a render, method chains that walk a domain object (`a.b.c.d`) in a render, data-shaping calls (sort / filter / map-with-logic) inside a render, helpers that reach into domain logic instead of formatting already-prepared data, conditional rendering driven by inspecting a domain object's state rather than reading a named boolean off a view model.
- **View Model Pattern** — a view never receives a domain entity. It receives a view model: a plain object shaped to that view's exact needs — pre-formatted strings, derived booleans (`showsEmpty`, `canEdit`), pre-sorted collections, pre-resolved URLs. The view model is computed in a hook, presenter, or use case — never in the template, never in a helper called from render. One view, one view model; don't reuse domain types across the view boundary or share a view model across unrelated views. This is the same shape as rule 2 of "No bare compound conditionals" above: state-shape decisions move onto the source (hook / value object), and the view reads named accessors.
- **Integration naming: Adapter vs Gateway** — the name on the wrapper signals what's inside. Use these terms precisely; don't reach for `*Client`, `*Service`, or `*Manager` as catch-alls. (See the Project Kickoff Sequence's _no external system without a port_ rule for **when** to introduce one; this rule is about **what to name** it.)
  - **`*Adapter`** — implements an internal interface (port) so a backend can be swapped at runtime. Translates one shape to another but does not own ser/deser of an external wire format. Multiple implementations of one persistence or messaging interface are the canonical example: all sit behind one interface and pass domain types through.
  - **`*Gateway`** — encapsulates _all_ access to a specific external system and owns the wire format on behalf of the rest of the codebase. A Gateway holds the request shaping, the network call, the response parsing, and the boundary validator (`parse(raw: unknown): T`); it exposes a clean typed interface that returns domain types and hides every integration mechanic. If you find yourself smearing those four concerns across a route, a parser, and a caller, consolidate them into a `*Gateway`.
  - **Anti-Corruption Layer** is the next step up — a Gateway plus translation between two _different_ domain models. Don't add one speculatively. If you ever integrate a third-party whose model doesn't match yours, that's when an ACL is warranted; until then, Gateway is the ceiling.
- **Intention-revealing names** — no abbreviations or single-letter variables; name everything after what it represents in the domain.
- **Explicit types** — annotate every variable, parameter, and return value where the language allows; no implicit `any` (or its equivalent).

## Tidy First Discipline

> "For each desired change, make the change easy (warning: this may be hard), then make the easy change."
> — [Kent Beck](https://twitter.com/kentbeck/status/250733358307500032)

This is the operational core. When the change you want is hard given the code's current shape, the move is _not_ to power through — it's to first reshape the code so the change becomes trivial. The reshaping is what Fowler names [preparatory refactoring](https://martinfowler.com/articles/preparatory-refactoring-example.html). The reshaping may be larger than the change itself; that's the warning in the parenthesis. Do it anyway, in a separate commit, then make the now-easy change.

The supporting premise (Beck, _Tidy First?_, 2023): structural changes and behavioral changes are different kinds of work and belong in separate commits. A **behavioral change** alters what the code computes. A **tidying** is a tiny structural change — guard clauses, dead code removal, reading order, normalizing symmetric branches, naming a compound conditional, extracting a helper — that does not alter behavior. Mixing the two in a single commit makes review harder, bisect harder, and hides bugs.

Rules — agents and humans alike:

1. **Make the change easy first, then make the easy change.** When a behavior change feels hard, stop. Ask: what tidying would make this change trivial? Do that tidying. Commit it on its own. Then write the now-trivial behavior change. The instinct to power through a hard change is almost always wrong — the resistance is signal that the structure is fighting you. This rule is the why behind every other rule in this section.
2. **One commit, one kind of change.** Never mix structural and behavioral edits in a single commit. If you find yourself wanting to tidy mid-feature, either stop and commit the tidying separately first, or write it down and come back. Agents in particular tend to "improve" unrelated code while implementing a feature — refuse this. A 12-file PR that's half feature and half drive-by cleanup is a red flag, not a productivity win.
3. **Tidy first by default; tidy after when the shape only emerges from doing the work; tidy never when the code is fine.** The "?" in the book title is about whether _this particular_ change needs tidying — not about whether tidy-first is a valid strategy. When tidying is warranted, do it before. Tidy _after_ only when the right structural shape is genuinely unknowable until the behavior is in. Tidy _never_ when the code is fine as-is or unlikely to be touched again — tidying is investment, and investment without expected return is waste.
4. **Tidyings are small.** A tidying is the smallest visible structural improvement: extract a named const for a compound conditional, isolate a guard clause, delete dead code, fix reading order in a file, normalize two near-identical branches. Preparatory refactoring can chain several tidyings, but each one is small and individually green-tested. If your "tidying" needs a design discussion, it isn't a tidying — it's a refactor; scope it as a separate ticket.
5. **Know when to stop.** One tidying always reveals another. Discipline is bounding the cleanup so the behavior change actually ships. When in doubt, ship the behavior with the minimum tidying it strictly requires; the rest goes on the list.
6. **Tidying commits state their value with a short before/after.** Every refactoring or preparatory-tidying microcommit message includes a `Before:` / `After:` / `Value:` block in the body that shows what improved and why it matters. The subject line keeps the standard `refactor: <what>` shape; the body makes the gain concrete. Example:

   ```
   refactor: extract handleKeyDown from <Component> onKeyDown

   Before: inline arrow with three branches in a render prop, no name, untestable in isolation.
   After:  named `handleKeyDown` declared above the return; render reads `onKeyDown={handleKeyDown}`.
   Value:  matches "Named event handlers over inline arrows"; handler is now unit-testable.
   ```

   `git log` becomes the index of _why_ the structure looks the way it does. Without the before/after, future-you cannot tell whether a `refactor:` commit was load-bearing preparatory work or drive-by churn — and drive-by churn is exactly what rule 2 prohibits.

   **The audience is not just human.** Every future agent (Claude, Codex, Gemini, Copilot) that opens this repo will read `git log` and the surrounding commits to orient itself before editing. The `Value:` line is what tells that agent which patterns are deliberate and load-bearing and which to preserve. Without it the agent sees only the diff — the _what_ — and is liable to undo a careful tidying because the result "looks cleaner the other way", or to skip a structural setup the next behavior change relies on. Spell out the value so the next agent learns the reasoning from the commit history instead of pattern-matching to its training defaults. Treat the commit body as durable instructions to your future colleague, who happens to be an LLM with no memory of why you made this change.

   Behavior commits don't need this block; the user-visible change is its own justification.

This discipline does not contradict **Vertical slicing** above. Vertical slicing scopes the _feature_ (build one user-visible thing top to bottom before starting the next). Tidy First scopes the _commit sequence within that feature_ (prepare the ground, then make the easy change, in separate commits). They're orthogonal — a single vertical slice routinely contains several alternating tidying and behavior commits.

## Testing Workflow

### End-to-end features follow a double loop (ATDD–TDD):

1. **Outer loop (ATDD)** — write one failing acceptance test describing the complete user-visible behavior before touching any implementation. Default to an integration test (~1s per spec) in `tests-medium-integration/<feature>/` — in-memory DOM + RTL for UI projects, in-memory adapters against the relevant fakes for headless services and bots. Escalate to a full-browser or full-stack E2E spec in `tests-big-e2e/<feature>/` only when the behavior genuinely requires it.
2. **Inner loop (TDD)** — drive each unit of logic with a failing microtest → minimal passing code → refactor.
3. Feature is done only when the outer ATDD test goes green.

### Unit features follow a TDD loop:

1. **Inner loop (TDD)** — drive each unit of logic with a failing microtest → minimal passing code → refactor.
2. Feature is done only when the unit's microtests are green and behavior matches the spec.

**Test pyramid** — three layers, in order of preference (push tests as far down as possible). Each layer is a sibling-of-`src/` folder mirroring the feature shape:

1. **Unit** — pure functions, value objects, adapters in isolation. Microtests, milliseconds. The default for any logic that can be tested without a UI mount or external integration. `tests-small-unit/<feature>/{lib,adapters,hooks,api,...}/*` (mirrors src down to the file). Perf-budget tests live alongside as `*.perf.*` and are excluded from the default fast suite.
2. **Integration** — mounts the top-level shell end-to-end in an in-memory environment; network, auth, persistence, and external SDKs stubbed via shared fakes from the relevant ports. ~1s per spec. The default home for new acceptance tests. `tests-medium-integration/<feature>/*` (flat at feature level — cross-layer journeys have no src counterpart).
3. **E2E** — full browser or full-stack against real external systems. Reserved for behaviors that genuinely need it (drag-and-drop, cross-context isolation, real OAuth handshakes, sandbox API contract tests). Slow; minimize. `tests-big-e2e/<feature>/*`. Shared global setup and stubs live at the lane root. Cross-cutting invariants live at `tests-big-e2e/cross-cutting/`.

**User-behavior driven (vertical slicing)** — integration and E2E spec files are named for user journeys in domain language, never for components, layers, or technical concerns. Examples for a Twitter-style bot: `send-a-tweet`, `delete-a-tweet`, `repost-a-thread`. Examples for a macro tracker: `log-some-food`, `adjust-an-entry`, `quick-add-favorites`. Forbidden: `search.spec.*`, `crud.spec.*`, `database.spec.*`. Each test describes something a user _does_ or _notices_, in domain language — not what the implementation does internally. If a test cannot be phrased as user-visible behavior it belongs at the unit level. The only legitimate exception is cross-cutting system invariants (sync, isolation) which live in dedicated files. This is non-negotiable — when in doubt, prefer the journey-named file over the component-named one.

**Tests are immutable** — never modify an existing test to make code pass; fix the implementation instead.
