---
name: backlog
description: Park a feature, idea, or follow-up into BACKLOG.md instead of implementing it now. Trigger when the user says "/backlog <description>", "add to backlog", "backlog this", "park this", "for later", "don't do this now but remember", or otherwise describes a thing they want recorded but not built. The argument is the item to add. Do NOT trigger for items the user wants implemented immediately.
---

# Backlog

Append the user's described item to `BACKLOG.md` at the repo root. Do not implement it.

## What to do

1. **Get today's date** by running `date +%Y-%m-%d` in the shell. Do not guess from context — always read the system clock so timestamps stay accurate.
2. **Read** `BACKLOG.md` from the repo root. If it does not exist, create it with a `# Backlog` H1 and a `## Open` H2.
3. **Append** the user's item as a single bullet at the end of the `## Open` section, prefixed with the date in square brackets (see Format below).
4. **Preserve the user's wording** — fix only obvious typos and capitalization. Do not paraphrase, expand, or "clean up" the description.
5. **Confirm** in one short line which item was added, then stop.

## What NOT to do

- Do not start implementing the feature.
- Do not file the item into memory (`MEMORY.md`) — backlog items go in `BACKLOG.md`. Memory backlogs are reserved for cross-conversation guidance, not feature lists.
- Do not invent metadata the user did not give: priority, owner, target date, effort estimate, acceptance criteria. If the user wants those, they will say so.
- Do not reorder, rephrase, or "tidy" existing items in the file.
- Do not split one user statement into multiple bullets unless they explicitly listed multiple distinct items (e.g. quoted strings, numbered list, or "and also").

## Format

Each item is a single bullet under `## Open`, prefixed with the date in `[YYYY-MM-DD]` form so the file can be sorted lexicographically by added-date:

```
- [YYYY-MM-DD] <description>
```

The `[YYYY-MM-DD]` format is load-bearing — it sorts correctly as a string and is easy to grep. Don't switch to other date formats.

If — and only if — the user gave a reason alongside the description, add it as a sub-bullet (the sub-bullet does NOT get its own date):

```
- [YYYY-MM-DD] <description>
  - Why: <reason verbatim>
```

## Multiple items in one invocation

If the user passes more than one item in a single trigger (e.g. several quoted strings, or a numbered list), append each as its own bullet, in the order given. Confirm with one line per item added.

## Done items (soft-delete)

Items don't get deleted from `BACKLOG.md` when implemented — they get moved to a `## Done` section at the bottom (create the section if missing) with the date the user shipped them. This skill only handles **adding** to `## Open`. Moving to `## Done` is a separate manual step the user will request — triggers include "mark X done", "soft-delete from backlog", "ship Y", or any equivalent.

**Format** — keep the original `[YYYY-MM-DD]` added date and append a `→ YYYY-MM-DD` shipped date inside the same brackets, separated by an arrow:

```
- [YYYY-MM-DD added → YYYY-MM-DD shipped] <description>
```

The two dates can be the same day; that's fine. Both dates are absolute — fetch today's date via `date +%Y-%m-%d` for the shipped half, do not guess from context.

The description, sub-bullets, and any other metadata are preserved verbatim — only the bracket prefix changes. New items append to the bottom of `## Done`; insertion order is the audit trail.

Items in `## Done` are never deleted. The section is the project's record of what shipped and when.
