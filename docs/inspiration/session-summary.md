# Conversation summary

## Goal

Audit and reduce Chrome tab clutter — go from a hoarded state down to something manageable.

## What we built

Two scripts in `~/Documents/rasiim/code/side_pieces/browser-zero/docs/inspiration/`:

| Script                   | Purpose                                                                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `extract_chrome_tabs.py` | Reads Chrome's on-disk `Session_*` / `Tabs_*` files across all 4 profiles. Forensic/recovery view — includes nav history + recently-closed buffer. |
| `live_chrome_tabs.py`    | Queries the running Chrome process via AppleScript. **The right tool** for "what's actually open now." Marks active tab per window.                |

Plus one recovery-log file per close round (`closed-tabs-round[1-6].txt`).

## Key discoveries

1. **Two Chrome instances were running.** A Gemini-Antigravity-managed Chrome (PID 64028) was hijacking AppleScript's bundle dispatch, making it look like your regular Chrome had 0 windows. Killing it fixed routing.
2. **PID 29472 has a 112-day-old `--restart` flag** in its command line — harmless; persists from whatever last triggered a relaunch.
3. **AppleScript's `repeat with t in tabs of w` under-enumerates** on large tab collections. The fix is `whose URL contains` — a declarative server-side query. This became the basis of every subsequent close round.
4. **The on-disk extractor is the wrong tool for "currently open."** Chrome's `Tabs_*` file _grows_ when you close tabs (recently-closed buffer for ⌘⇧T). The live AppleScript script is faster (~0.6s vs ~30s) and accurate.

## Close rounds (substring match on URL)

| Round | Patterns                                                                                                                             |      Tabs closed |          Running total |
| ----: | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------: | ---------------------: |
|     1 | chatgpt, perplexity, workflowy, wikipedia, dmv.dc.gov, platform.openai, google.com/maps                                              | 124 (passes 1–7) |              235 → 179 |
|     2 | gemini, /search?q=, console.cloud, grok, copilot, registry.npmjs, accounts.google                                                    |               56 | 179 → 179 (live count) |
|     3 | 36 patterns (DMV, martial arts, math bot, architecture singletons, DNA research, accounting research, subscription audit, long tail) |               38 |              179 → 141 |
|     4 | health.ny.gov, meta.ai, bodyrecomp, nyc.gov, docs.google, replit, analytics.google                                                   |               18 |              141 → 123 |
|     5 | amazon, youtube                                                                                                                      |               31 |               123 → 94 |
|     6 | chrome://newtab                                                                                                                      |               12 |            94 → **75** |

**Net: 235 → 75 tabs (68% reduction), 31 → 21 windows.**

## Useful files now on disk

- `chrome_tabs.txt` — latest session-file extract (forensic)
- `chrome_tabs_live.txt` — latest live tab listing (authoritative)
- `extract_chrome_tabs.py`
- `live_chrome_tabs.py`
- `closed-tabs*.txt` — recovery logs (URLs are restorable via ⌘⇧T or paste)

All files now live in `~/Documents/rasiim/code/side_pieces/browser-zero/docs/inspiration/`. Script defaults updated so future runs write into this folder.
