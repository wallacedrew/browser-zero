---
name: tcr
description: Use when implementing behavior with Test && Commit || Revert (TCR). Enforces ultra-small safe changes where failing tests automatically discard all progress. Trigger when the user says "TCR", "test commit revert", or asks to work in baby steps with automatic revert on failure. Also trigger for refactoring under safety constraints, or when the user wants to enforce micro-iteration discipline.
version: 2.0.0
---

# TCR — Test && Commit || Revert

Implement behavior using enforced micro-iterations:

```
test && commit || revert
```

- If tests pass → commit immediately
- If tests fail → revert ALL changes to last green state

There is no red phase. You cannot save a failing test. Every change you make must leave the codebase green, or it ceases to exist.

---

## Core Principles (non-negotiable)

- **You are always in a green state.** The codebase never contains broken code.
- **Revert is liberation, not punishment.** Having incorrect code instantly deleted counteracts the Sunk Cost Fallacy. You almost always find a better, surer, more incremental path on the second attempt.
- **If you don't want a bunch of code wiped out, don't write a bunch of code between greens.** The size of the change IS the risk.
- **No cheating.** After a revert, do NOT recover the reverted code from memory, undo history, or editor buffers. The revert happened for a reason. Stop, rethink the approach, and find a smaller step.

---

## Relationship to TDD

TCR is not a replacement for TDD. It is a different workflow with a different constraint. TDD has Red → Green → Refactor. TCR has no Red phase — you cannot save a failing test because it gets reverted.

TCR can be used alongside TDD (particularly in refactoring), or as a standalone discipline for enforcing baby-step development. Many practitioners use TDD for feature work and TCR for refactoring, or layer TCR's commit/revert constraint on top of TDD's test-first thinking.

---

## The Three TCR Moves (Beck)

Progress under the revert constraint happens through three specific strategies:

### 1. Add Test and Pass (Together)

Write a new test AND the code that makes it pass in the same atomic change. The goal is to shorten the time between idea and _some_ kind of test passing in _some_ kind of way. Even writing part of the test is fine. Cheating (hardcoding, returning constants) is encouraged — as long as you don't stop there.

### 2. Better Passing

Once you have a test passing with a fake or minimal implementation, replace it with a real implementation — a little at a time. Each replacement step must keep all tests green.

### 3. Make Hard Changes Easy

Rather than change four places in the code, introduce a helper function (a little at a time) so you can change one place. Prepare the structure first, then make the actual change. This is the Mikado Method in miniature.

---

## The Missing Red Step

TCR's biggest trade-off: you lose the ability to watch a test fail before making it pass. This means you lose confidence that your test is actually testing anything meaningful.

**Known workarounds:**

- **Invert-and-verify (Danil Suits):** After writing test + passing code together, invert the conditional in your implementation. If the test now fails (and gets reverted), you've proven the test was actually checking something. If it still passes, your test is weak.
- **TRC — the symmetric of TCR (Xavier Detant):** Run tests; if green, revert; if red, commit. This recovers the Red step. Use TRC to validate that your new test fails without the implementation, then switch back to TCR for the Green step.
- **Pragmatic acceptance:** For straightforward cases (testing a return value, checking an edge case), the risk of a vacuous test is low. Save the verification techniques for complex logic.

---

## Two Modes of TCR

### Refactoring Mode (start here)

TCR is most natural for refactoring — pure structural changes where every step should remain green by definition. If a refactoring step breaks tests, it wasn't a refactoring. Start with TCR for refactoring only before using it for feature work.

### Feature Mode

Adding new behavior under TCR requires the "Add Test and Pass Together" move. This is harder than refactoring mode because you must write test + implementation as one atomic change small enough to survive.

---

## Workflow

### Step 1 — Establish Baseline

- Ensure all tests pass (you must start green)
- Set up the TCR command:
  ```bash
  <test command> && git commit -am "tcr" || git checkout .
  ```
- Commit messages are intentionally minimal — TCR produces many small commits that will be squashed later

### Step 2 — Choose Micro-Goal

Define the smallest possible behavior change:

- One assertion + its passing implementation
- One rename, one extraction, one structural move
- If it feels "complete" — it's too big

### Step 3 — Make a Tiny Change

Apply one of the three TCR moves:

- **Adding behavior:** Write test + passing code together in one change
- **Improving implementation:** Replace a fake with a real implementation, one step at a time
- **Preparing for change:** Introduce helpers, extract methods, restructure — keeping green throughout

### Step 4 — Run TCR

```bash
test && commit || revert
```

**If committed:** Move to next micro-goal.

**If reverted:**

- Do NOT re-type the same code. The approach was wrong or too large.
- Ask: Can I make this change smaller?
- Ask: Can I prepare the codebase first (Move 3) so the actual change is trivial?
- Ask: Am I attacking from the wrong angle?

### Step 5 — Repeat

Continue until the feature or refactoring is complete. Squash commits when done.

---

## Diagnostic Signals

- **Getting reverted frequently →** Your steps are too large. Make them smaller.
- **Steps keep shrinking over the session →** You're fatigued. Stop and return fresh.
- **You want to Ctrl+Z after a revert →** This is the cheating instinct. Resist it. Find a different path.
- **A refactoring step gets reverted →** It wasn't a true refactoring. You changed behavior. Decompose further.
- **You can't figure out a small enough step →** Use Move 3 (Make Hard Changes Easy) — restructure first, then make the actual change.
- **Test seems vacuous →** Use the invert-and-verify technique to validate it actually tests something.

---

## Anti-Patterns (forbidden)

- Recovering reverted code from memory or undo history (cheating)
- Writing a failing test by itself (there is no Red phase — it will be reverted)
- Making large changes and hoping they pass
- Skipping the revert when tests fail ("just this once")
- Writing elaborate commit messages (they'll be squashed — use "tcr" or a timestamp)
- Treating revert as failure (it's feedback, not punishment)

---

## Output Discipline (for Claude)

At each step, explicitly state:

- **TCR Move:** Add Test+Pass / Better Passing / Make Hard Changes Easy
- **Mode:** Refactoring / Feature
- **Change description:** What specific tiny change is being made
- **Result:** Committed (all green) or Reverted (what went wrong, what smaller step to try next)
- **Step size assessment:** Was this the right granularity?

After a revert, do NOT reproduce the reverted code. Describe a different, smaller approach and execute that instead.
