#!/usr/bin/env python3
"""
Extract URLs from every Chrome profile's on-disk session files.

Chrome stores per-window/tab navigation state in binary SNSS files inside each
profile's `Sessions/` subdirectory:

  Tabs_<timestamp>     — currently-open tabs (most recent = "Current Tabs")
  Session_<timestamp>  — window layout snapshot (most recent = "Current Session")

URLs are stored as plain UTF-8 inside those binary records, so a careful regex
pull is good enough to enumerate them. This script picks the newest Tabs_* and
Session_* per profile, extracts URLs, filters obvious ad/tracking/iframe noise,
and writes a deduped report grouped by host.

Caveats:
  - Output is the SUPERSET of per-tab navigation history, not exactly the current
    URL of each tab. A tab with several back/forward entries will contribute
    multiple URLs. Use --first-per-host to compress.
  - Incognito sessions are NOT written to disk by Chrome — those URLs cannot be
    recovered programmatically. Run while Chrome has those tabs open and use
    AppleScript instead (`tell application "Google Chrome" to ...`).
  - AppleScript is the right tool when Chrome is running with visible windows;
    this script is the fallback for when Chrome is mid-restart or you need the
    on-disk snapshot.

Usage:
    python3 extract_chrome_tabs.py                          # default output
    python3 extract_chrome_tabs.py -o /tmp/tabs.txt          # custom output
    python3 extract_chrome_tabs.py --include-noise           # keep ad/iframe URLs
    python3 extract_chrome_tabs.py --chrome-base "/path/..."  # non-default profile root
"""
import argparse
import datetime
import glob
import os
import re
from collections import defaultdict
from urllib.parse import urlparse

DEFAULT_CHROME_BASE = os.path.expanduser(
    "~/Library/Application Support/Google/Chrome"
)
DEFAULT_OUTPUT = os.path.expanduser(
    "~/Documents/rasiim/code/side_pieces/browser-zero/docs/inspiration/chrome_tabs.txt"
)

# Match http(s):// URLs embedded in binary session blobs. The character class
# excludes control bytes, whitespace, and high-bit bytes that would indicate the
# URL has ended and the next record's binary preamble has begun.
URL_RE = re.compile(
    rb'(https?://[^\x00-\x20"<>\\^`{|}\x7f-\xff]{3,2048})'
)

# Hosts/path fragments that are almost always served inside ad iframes,
# tracking pixels, or syndication beacons — not actual user-opened tabs.
NOISE_HOST_SUFFIXES = (
    "googlesyndication.com",
    "safeframe.googlesyndication.com",
    "doubleclick.net",
    "googletagmanager.com",
    "google-analytics.com",
    "googleadservices.com",
    "gstatic.com",
    "scf.usercontent.goog",
    "googleusercontent.com",
    "adservice.google.com",
    "adnxs.com",
    "criteo.com",
    "rubiconproject.com",
    "scorecardresearch.com",
    "moatads.com",
    "amazon-adsystem.com",
    "pubmatic.com",
    "openx.net",
    "casalemedia.com",
)
NOISE_PATH_HINTS = (
    "/ads?",
    "/adview",
    "/pixel",
    "/beacon",
    "/pagead/",
    "/track?",
    "/pcs/activeview",
)


def discover_profiles(chrome_base):
    """Yield (profile_dir, friendly_label) for every Chrome profile present.

    Reads `Local State` to map profile dirs ('Default', 'Profile 1', ...) to
    their user-visible names and signed-in account emails.
    """
    local_state = os.path.join(chrome_base, "Local State")
    profiles = {}
    try:
        import json
        with open(local_state) as f:
            data = json.load(f)
        for dir_name, info in (
            data.get("profile", {}).get("info_cache", {}).items()
        ):
            label = info.get("name", "?")
            email = info.get("user_name", "")
            profiles[dir_name] = (
                f"{label} ({email})" if email else label
            )
    except FileNotFoundError:
        pass

    # Walk filesystem too in case Local State is missing or stale.
    for candidate in ["Default"] + sorted(glob.glob(os.path.join(chrome_base, "Profile *"))):
        name = os.path.basename(candidate) if os.path.sep in candidate else candidate
        if not os.path.isdir(os.path.join(chrome_base, name)):
            continue
        if name not in profiles:
            profiles[name] = name
    return list(profiles.items())


def newest_matching(pattern):
    matches = glob.glob(pattern)
    return max(matches, key=os.path.getmtime) if matches else None


def extract_urls(path):
    """Pull every http(s):// URL string out of a binary session file."""
    with open(path, "rb") as f:
        blob = f.read()
    seen = set()
    ordered = []
    for match in URL_RE.finditer(blob):
        url = match.group(1).decode("utf-8", errors="replace")
        # Strip trailing punctuation that often sneaks into URL matches.
        url = url.rstrip(".,;:)]}\"'")
        if len(url) < 8 or url in seen:
            continue
        seen.add(url)
        ordered.append(url)
    return ordered


def is_noise(url):
    try:
        parsed = urlparse(url)
    except Exception:
        return True
    host = (parsed.hostname or "").lower()
    if not host or "." not in host:
        return True
    if host.startswith("127.") or host == "localhost":
        return False  # local dev URLs are signal, not noise
    if any(host.endswith(suf) for suf in NOISE_HOST_SUFFIXES):
        return True
    lower = url.lower()
    if any(hint in lower for hint in NOISE_PATH_HINTS):
        return True
    return False


def format_report(chrome_base, include_noise):
    lines = []

    def out(text=""):
        lines.append(text)

    out(f"Chrome tabs / session URLs — extracted {datetime.datetime.now():%Y-%m-%d %H:%M}")
    out("Source: Chrome's on-disk session files (Tabs_* and Session_* under each")
    out(f"profile's Sessions/ subdir, rooted at {chrome_base!r}).")
    out("Includes navigation history per open tab, deduped, with ad/tracking/")
    out("iframe noise " + ("INCLUDED." if include_noise else "filtered out."))
    out("=" * 78)

    grand_total = 0
    for profile_dir, label in discover_profiles(chrome_base):
        sessions_dir = os.path.join(chrome_base, profile_dir, "Sessions")
        tabs_file = newest_matching(os.path.join(sessions_dir, "Tabs_*"))
        sess_file = newest_matching(os.path.join(sessions_dir, "Session_*"))
        raw_urls = set()
        source_info = []
        for path in (tabs_file, sess_file):
            if not path:
                continue
            raw_urls.update(extract_urls(path))
            mtime = datetime.datetime.fromtimestamp(os.path.getmtime(path))
            size_kb = os.path.getsize(path) / 1024
            source_info.append(
                f"{os.path.basename(path)} ({size_kb:.0f} KB, {mtime:%Y-%m-%d %H:%M})"
            )

        filtered = sorted(
            raw_urls if include_noise else {u for u in raw_urls if not is_noise(u)}
        )

        out()
        out("=" * 78)
        out(f"{profile_dir} — {label}")
        out(f"  source files: {', '.join(source_info) if source_info else '(none)'}")
        out(f"  raw URLs: {len(raw_urls)}   after filter: {len(filtered)}")
        out("=" * 78)

        if not filtered:
            out("  (no URLs)")
            continue

        by_host = defaultdict(list)
        for url in filtered:
            host = (urlparse(url).hostname or "?").lower()
            by_host[host].append(url)
        for host in sorted(by_host):
            out(f"\n[{host}]  ({len(by_host[host])})")
            for url in by_host[host]:
                out(f"  {url}")

        grand_total += len(filtered)

    out()
    out("=" * 78)
    out(f"GRAND TOTAL across all profiles: {grand_total} unique URLs")
    out("=" * 78)
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Extract every URL from Chrome's on-disk session files."
    )
    parser.add_argument(
        "-o",
        "--output",
        default=DEFAULT_OUTPUT,
        help=f"Output file path (default: {DEFAULT_OUTPUT})",
    )
    parser.add_argument(
        "--chrome-base",
        default=DEFAULT_CHROME_BASE,
        help=f"Chrome data directory (default: {DEFAULT_CHROME_BASE})",
    )
    parser.add_argument(
        "--include-noise",
        action="store_true",
        help="Don't filter ad/tracking/iframe URLs",
    )
    parser.add_argument(
        "--stdout",
        action="store_true",
        help="Print report to stdout instead of writing to a file",
    )
    args = parser.parse_args()

    report = format_report(args.chrome_base, args.include_noise)
    if args.stdout:
        print(report)
    else:
        with open(args.output, "w") as f:
            f.write(report)
        print(f"Wrote report to: {args.output}")


if __name__ == "__main__":
    main()
