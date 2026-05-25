#!/usr/bin/env python3
"""
List every currently-open Chrome tab — live, via AppleScript.

This is the right tool when you want to know what's actually in your browser
RIGHT NOW. Unlike extract_chrome_tabs.py (which reads Chrome's on-disk
Session_* / Tabs_* files), this script queries the running Chrome process
through AppleScript and returns one row per live tab.

Caveats:
  - Incognito windows are NOT visible to AppleScript — Chrome hides them by
    design. There is no programmatic way around this.
  - If two Chrome instances are running with the same bundle id (e.g. a
    Gemini-Antigravity-managed Chrome on a custom --user-data-dir), AppleScript
    will route to whichever one Launch Services registered first. The other
    instance is invisible to this tool. If you see fewer tabs than expected,
    that's usually the cause.
  - Chrome must allow your terminal/Claude Code to automate it. macOS prompts
    once per app; check System Settings → Privacy & Security → Automation.

Usage:
    python3 live_chrome_tabs.py                     # by-window view → ~/chrome_tabs_live.txt
    python3 live_chrome_tabs.py --by-host            # group by host instead
    python3 live_chrome_tabs.py --stdout             # print, don't write
    python3 live_chrome_tabs.py -o /tmp/now.txt      # custom path
    python3 live_chrome_tabs.py --urls-only          # one URL per line, no titles
"""
import argparse
import datetime
import os
import subprocess
import sys
from collections import defaultdict
from urllib.parse import urlparse

DEFAULT_OUTPUT = os.path.expanduser(
    "~/Documents/rasiim/code/side_pieces/browser-zero/docs/inspiration/chrome_tabs_live.txt"
)

# AppleScript is run as one block. Notes on the implementation:
#   - `fieldSep` is bound to ASCII 9 OUTSIDE the `tell application "Google
#     Chrome"` block. Inside that block, the identifiers `tab` and `TAB`
#     (AppleScript is case-insensitive) are shadowed by Chrome's `tab` object
#     class, so a generically-named variable is required.
#   - We capture the id of each window's `active tab` once per window, then
#     mark tabs whose id matches. This is more reliable than positional checks.
APPLESCRIPT = r'''
on run
    set fieldSep to ASCII character 9
    set output to ""
    tell application "Google Chrome"
        set winIdx to 0
        repeat with w in windows
            set winIdx to winIdx + 1
            set activeId to -1
            try
                set activeId to id of active tab of w
            end try
            set tabIdx to 0
            repeat with t in tabs of w
                set tabIdx to tabIdx + 1
                set isActive to "0"
                try
                    if id of t is activeId then set isActive to "1"
                end try
                try
                    set theTitle to title of t
                on error
                    set theTitle to ""
                end try
                try
                    set theURL to URL of t
                on error
                    set theURL to ""
                end try
                set output to output & winIdx & fieldSep & tabIdx & fieldSep & isActive & fieldSep & theTitle & fieldSep & theURL & linefeed
            end repeat
        end repeat
    end tell
    return output
end run
'''


def fetch_live_tabs():
    """Run AppleScript and return parsed rows."""
    result = subprocess.run(
        ["osascript", "-e", APPLESCRIPT],
        capture_output=True,
        text=True,
        timeout=180,
    )
    if result.returncode != 0:
        sys.exit(
            "osascript failed (rc={}):\n{}".format(result.returncode, result.stderr.strip())
        )
    rows = []
    for line in result.stdout.splitlines():
        parts = line.split("\t", 4)
        if len(parts) != 5:
            continue
        win, tab, active, title, url = parts
        rows.append(
            {
                "window": int(win),
                "tab": int(tab),
                "active": active == "1",
                "title": title,
                "url": url,
            }
        )
    return rows


def format_by_window(rows):
    lines = []
    by_window = defaultdict(list)
    for row in rows:
        by_window[row["window"]].append(row)
    for window_index in sorted(by_window):
        tabs = by_window[window_index]
        lines.append(f"=== Window {window_index} ({len(tabs)} tabs) ===")
        for tab in tabs:
            marker = "*" if tab["active"] else " "
            title = tab["title"] or "(untitled)"
            lines.append(f"  {marker} {tab['tab']:3d}. {title}")
            lines.append(f"         {tab['url']}")
        lines.append("")
    return "\n".join(lines)


def format_by_host(rows):
    lines = []
    by_host = defaultdict(list)
    for row in rows:
        host = (urlparse(row["url"]).hostname or "?").lower()
        by_host[host].append(row)
    for host in sorted(by_host):
        lines.append(f"[{host}]  ({len(by_host[host])})")
        for row in by_host[host]:
            active = " *" if row["active"] else "  "
            lines.append(f" {active} {row['url']}")
        lines.append("")
    return "\n".join(lines)


def format_urls_only(rows):
    return "\n".join(row["url"] for row in rows)


def build_report(rows, mode):
    formatter = {
        "window": format_by_window,
        "host": format_by_host,
        "urls": format_urls_only,
    }[mode]

    window_count = len({row["window"] for row in rows})
    tab_count = len(rows)
    active_count = sum(1 for r in rows if r["active"])

    header_lines = [
        f"Chrome — live tab listing — {datetime.datetime.now():%Y-%m-%d %H:%M:%S}",
        f"Source: AppleScript query against the running Chrome process.",
        f"Windows: {window_count}   Tabs: {tab_count}   Active (foreground) tabs: {active_count}",
        f"Note: Incognito windows are invisible to AppleScript and excluded.",
        "=" * 78,
        "",
    ]
    return "\n".join(header_lines) + formatter(rows) + "\n"


def main():
    parser = argparse.ArgumentParser(
        description="List Chrome's currently-open tabs (live, via AppleScript)."
    )
    parser.add_argument(
        "-o",
        "--output",
        default=DEFAULT_OUTPUT,
        help=f"Output path (default: {DEFAULT_OUTPUT})",
    )
    parser.add_argument(
        "--stdout",
        action="store_true",
        help="Print report to stdout instead of writing to a file.",
    )
    grouping = parser.add_mutually_exclusive_group()
    grouping.add_argument(
        "--by-host",
        action="store_const",
        const="host",
        dest="mode",
        help="Group output by host (alphabetical) instead of by window.",
    )
    grouping.add_argument(
        "--urls-only",
        action="store_const",
        const="urls",
        dest="mode",
        help="Emit one URL per line, no titles or grouping.",
    )
    parser.set_defaults(mode="window")
    args = parser.parse_args()

    rows = fetch_live_tabs()
    if not rows:
        sys.exit(
            "No tabs returned. Chrome may not be running, may be Incognito-only,\n"
            "or AppleScript may be routed to a second Chrome instance (kill any\n"
            "duplicate Chrome — e.g. an Antigravity-managed one — and retry)."
        )
    report = build_report(rows, args.mode)

    if args.stdout:
        sys.stdout.write(report)
    else:
        with open(args.output, "w") as f:
            f.write(report)
        window_count = len({row["window"] for row in rows})
        print(
            f"Wrote {len(rows)} tabs across {window_count} windows → {args.output}"
        )


if __name__ == "__main__":
    main()
