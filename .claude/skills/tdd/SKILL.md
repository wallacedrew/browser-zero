---
name: tdd
description: Use when implementing or modifying behavior via strict test-first development (Red → Green → Refactor). Applies to new features, bug fixes, and refactors requiring behavioral safety. Trigger whenever the user says "TDD", "test-first", "red green refactor", or asks to implement something with tests driving the design. Also trigger when fixing bugs test-first or when the user wants behavioral safety during a refactor.
version: 2.0.0
---

# TDD — Canon Red → Green → Refactor

Implement behavior incrementally using tests as the sole driver of design.
Derived from Kent Beck's Canon TDD and Uncle Bob Martin's Three Laws.

---

## The Three Laws (non-negotiable)

1. **No production code without a failing test.** You are not allowed to write any production code unless it is to make a failing unit test pass.
2. **No more test than sufficient to fail.** You are not allowed to write any more of a unit test than is sufficient to fail — and compilation/type errors count as failures.
3. **No more production code than sufficient to pass.** You are not allowed to write any more production code than is sufficient to pass the one failing unit test.

These three laws keep the system executing at all times. The gap between running tests should be seconds to minutes, never longer.

---

## The Two Kinds of Design

Understand which design decisions belong where:

- **Interface design** (API, contracts, how behavior is invoked) → happens when writing the test (Step 2)
- **Implementation design** (internals, structure, how behavior is fulfilled) → happens when refactoring (Step 4)

Do not mix these. When writing a test, you are designing the interface. When refactoring, you are designing the implementation. Keeping them separate produces cleaner results.

---

## Workflow

### Step 0 - Preparatory Refactoring

## Tidy First Discipline

> "For each desired change, make the change easy (warning: this may be hard), then make the easy change."
> — [Kent Beck](https://twitter.com/kentbeck/status/250733358307500032)

- refer to tidy-first skill

### Step 1 — Test List

Before writing any code, list all expected behavioral variants for the change. This is behavioral analysis, not implementation planning.

- Think in behaviors: "the basic case, what if the key is missing, what if the service times out..."
- Include edge cases and failure paths
- Do NOT mix in implementation decisions — there will be time for that later
- State the list, then begin immediately — do not block waiting for approval
- **The list is living.** Add to it during Steps 2–3 as you discover new cases. If a new case invalidates earlier work, consider restarting with a different test order.

### Step 2 — Red (Write One Failing Test)

Pick the next test from the list. **Test selection is a skill, not arbitrary.** Start with the simplest, most degenerate case and progress toward complexity. The order you pick tests significantly affects the final design.

- Write one concrete, runnable test with setup, invocation, and assertions
- Work backwards from the assertion when useful
- Run the suite and confirm:
  - The new test fails for the expected reason (not setup errors, not missing imports)
  - All existing tests still pass
- **If the failure is unclear → fix the test, not the code**

You are making interface design decisions here. Minimize implementation leakage into the test.

### Step 3 — Green (Make It Pass)

Change the system so the test passes. Write the minimum production code sufficient to pass — no more.

- Hardcoding is legitimate if it satisfies the current test
- No abstractions unless the test demands them
- No speculative generalization
- If you discover new test cases during this step, add them to the test list
- If a new case invalidates your current approach, decide: push through or restart with a different test order (prefer restarting)

### Step 4 — Refactor (Optional, Implementation Design)

Now — and only now — make implementation design decisions.

- Improve naming, extract duplication, clarify structure
- Remove dead code
- Run suite — all tests must remain green
- **Do not refactor further than necessary for this session.** Over-refactoring can be avoidance of the next hard test.
- Duplication is a hint, not a command. Abstract only when the pattern is clear.

### Step 5 — Repeat

Return to Step 2. Continue until the test list is empty and your uncertainty about the code's correctness has been replaced by confidence.

---

## Test Quality Constraints

Each test must:

- Assert one behavior (single reason to fail)
- Be deterministic (no uncontrolled randomness, time, or network)
- Read as a spec (clear intent from name + structure)
- Test behavior, not implementation internals
- Have real assertions (not empty "coverage" tests, not copy-pasted computed values)

---

## Definition of Done

- All tests from the list are implemented and passing
- No failing or skipped tests
- The test list is empty and no remaining uncertainty about behavioral coverage
- Code has been refactored to acceptable clarity
- No unnecessary abstractions remain

---

## Anti-Patterns (forbidden)

- Writing implementation before seeing a failing test
- Writing multiple tests before making any pass (speculative test batching)
- Adding logic beyond what the current test requires
- Testing private/internal methods directly
- Deleting or weakening assertions to make tests "pass"
- Copy-pasting computed values into expected values (defeats double-checking)
- Mixing refactoring into the Red→Green step (one hat at a time)
- Using snapshots where explicit assertions are possible

---

## Diagnostic Heuristics

- **Implementation feels complex →** you skipped a smaller test. Back up.
- **Test is hard to write →** the design is unclear. Reconsider the interface.
- **You can't figure out the next test →** revisit the test list. Maybe reorder.
- **Refactor step feels scary →** you don't trust your tests. Add more behavioral coverage first.
- **You're refactoring for a long time →** you might be avoiding the next hard test. Move on.

---

## Output Discipline (for Claude)

At each step, explicitly state:

- **Phase:** Red / Green / Refactor
- **Test list status:** remaining count, any additions
- **Current test:** what behavior is under test
- **Result:** why it fails (Red) or passes (Green), what minimal change was made
- **Design mode:** interface decision (Red) or implementation decision (Refactor)

Run the full test suite after every change. Report the result.
