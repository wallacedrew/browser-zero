---
name: architecture-risk-check
description: Identifies the most volatile and architecturally-important parts of a codebase — the change magnets where business logic, integration seams, and frequent stakeholder requests concentrate, and where elevated design discipline pays the highest ROI. Trigger this skill aggressively whenever the user asks about "volatile parts," "hotspots," "change magnets," "what's architecturally important," "where will this change most," "where to focus design discipline," "what parts need to stay healthy," "where should I refactor first," "where's the architectural heat," or any variant about identifying high-pressure zones in a codebase. Also trigger for churn analysis requests, "find the parts that change a lot," questions about which modules deserve the most rigor, or when the user is prioritizing refactoring effort. Even if the user does not use the exact word "volatile," trigger this if the underlying question is about locating change-prone or architecturally-load-bearing code. Output is a concise ranked map of zones with the specific design discipline each one needs.
---

# Volatility Radar

Identify the parts of a codebase where change concentrates — and therefore where design discipline pays the highest ROI.

## Why this matters

Volatile zones are where accidental complexity and tech debt accrue fastest. Every sloppy function, every primitive-obsessed parameter, every SOLID violation in these zones gets multiplied by the change frequency. Conversely, design rigor spent on a stable utility module is mostly wasted — that code rarely moves.

The Pareto move: find the ~20% of the codebase that absorbs ~80% of the change pressure, and keep _those_ parts surgical. This skill produces that map.

## What to deliver

A ranked list of **3–6 hotspots** in the codebase under discussion, ordered by combined volatility × architectural importance. For each:

- **Name the zone** — the bounded context, module, or concept (not a file path)
- **Why it's volatile** — one sentence, tied to a specific source of change pressure
- **The discipline that fits** — the 1–2 principles whose absence would hurt _this specific zone_ the most (don't recite all of SOLID; pick the ones whose failure mode matches the zone's failure mode)

Close with a one-line standing reminder of the quality bar:

> SOLID, GRASP, no primitive obsession, small composed functions, ports-and-adapters at the boundaries. The change rate is what makes the rigor pay.

Concise means concise. Default ceiling: ~250 words for the whole answer unless the user asks for depth.

## Identification lenses

Run through these. Each surfaces a different kind of volatility. Use whichever apply to the codebase in front of you.

### 1. Domain core (business logic concentration)

Where do the rules of the business actually live? Pricing, eligibility, scoring, state machines, calculations, policy enforcement, workflow orchestration. These mutate every time the business model adjusts — which in most companies is constantly.
_Failure mode:_ primitive obsession (passing `(amount, currency, customer_tier, region)` instead of a `Price` value object), god-classes, hidden coupling between rules.
_Discipline:_ value objects, explicit state machines, small policy classes, intention-revealing names.

### 2. Integration seams (boundaries)

Every place the system touches the outside world: payment processors, identity providers, third-party APIs, webhooks, message queues, file uploads, external auth, regulatory reporting. Outside parties change their contracts; your translation layer absorbs it.
_Failure mode:_ third-party data shapes leak into the domain. One vendor's quirks become every developer's problem.
_Discipline:_ anti-corruption layer, ports-and-adapters, contract tests at the boundary, no third-party types past the seam.

### 3. User-facing workflows

Anywhere a product manager has direct opinions: signup, onboarding, dashboards, search, notifications, settings, checkout. Product iteration touches these every sprint.
_Failure mode:_ logic accretes in controllers/views; the same flow is half-rewritten three times.
_Discipline:_ extract use-case / interactor objects, separate orchestration from rendering, keep controllers dumb.

### 4. Cross-cutting concerns under pressure

Auth, permissions, audit logging, feature flags, billing tiers. These mutate as the company grows tiers, adds compliance, restructures plans.
_Failure mode:_ permission checks scattered everywhere; billing logic duplicated and divergent.
_Discipline:_ single source of truth per concern, policy objects, capability-based permissions over scattered role checks.

### 5. Reporting and analytics

Every new business question = a new report or query. These accumulate change like dust on a windowsill.
_Failure mode:_ the same business metric defined three different ways across three reports.
_Discipline:_ shared metric definitions, materialized views or read models, separation from transactional logic.

### 6. The historical hotspot

In a legacy codebase, the past predicts the future. If git history is available, run churn analysis. The files most touched in the last 6–12 months are the highest-confidence forecast for what'll be touched in the next 6–12.

```bash
# Files changed most often in the last year
git log --since='1 year ago' --pretty=format: --name-only \
  | sort | uniq -c | sort -rg | head -20

# Bonus: files with the most distinct authors (coupling signal)
git log --since='1 year ago' --pretty=format:'%an' --name-only \
  | awk 'NF' | ... # build a map per-file of unique authors
```

If churn data is available, weight the answer toward what the data shows — the lenses above predict, the git history confirms.

## How to handle missing context

If the user hasn't shared the codebase, ask one short question: _"Quick context — what does this app do, and what stack? A 30-second sketch lets me name actual zones instead of generic ones."_

If they want a generic answer anyway, give the canonical hotspot list (domain core, integration seams, auth/permissions, billing, user workflows, reporting) framed as _"in most apps these are the usual suspects — confirm against your situation."_

Don't refuse to answer for lack of context. Default to useful.

## What to avoid

- **No abstract lectures on SOLID/GRASP.** The user knows. Apply principles to the _specific_ zones found.
- **No file inventories.** This is a ranking exercise, not a directory listing.
- **No padding.** If the answer is six bullets, write six bullets.
- **No flattery.** Skip "great question."
- **The word "productivity" is banned.** Use "speed" if a velocity concept is needed.

## Optional: AXP tie-in

If the conversation is already in AXP framing, name which AXP design property is most at risk per zone:

- **Mutation Resistance** — high-churn zones; can this code survive 50 more edits without rotting?
- **Intent Legibility** — domain-rule zones; can a new dev (or agent) read the _why_, not just the _what_?
- **Causal Transparency** — integration seams; can a bug be traced back through the boundary?
- **Executable Truth Source** — any zone where docs and code drift; do tests assert the rules?

Don't force this in if the conversation hasn't gone there. It's flavor, not requirement.

---

Identify the heat. Name the discipline that fits. Get out.
