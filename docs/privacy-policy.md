---
title: Privacy policy
permalink: /privacy-policy/
---

# browser-zero privacy policy

**Effective date:** 2026-05-11

browser-zero is a Chrome extension that shows every open tab across every
Chrome window on one page, so you can search, group, drag between windows,
and bulk-close tabs.

## What data the extension reads

To show you your tabs, browser-zero reads the following from Chrome via the
`chrome.tabs` and `chrome.tabGroups` APIs:

- The list of open tabs in each Chrome window
- Each tab's **title**, **URL**, **favicon URL**, and **last-accessed time**
- Each tab's **window** and **Chrome tab group** (if any), including the
  group's title and color

When you act on tabs from the dashboard, browser-zero also asks Chrome to:

- Focus a tab and its window (when you click a row)
- Close one or more tabs (when you click × / Close? / bulk Close?)
- Move a tab between windows (when you drag a row to another window
  section)
- Create a new Chrome tab group or add tabs to an existing group (when
  you use the "Add to group" action)

## Where that data goes

**Nowhere.** browser-zero does not transmit any of this data to any server.
There is no telemetry, no analytics, no error reporting, no cloud sync, and
no third-party SDKs. Everything happens locally in the extension page
running on your machine.

## What is stored

Nothing persistent. The dashboard is stateless — every time you open it, it
asks Chrome for the current set of tabs. Closing the dashboard tab forgets
everything. No `chrome.storage`, `localStorage`, `IndexedDB`, or cookies
are used by the extension.

## Network requests

The only network requests the extension makes are the favicon `<img>` tags
loading favicons from each tab's origin server (the same servers your
browser already contacted to load those tabs). browser-zero does not send
your data to those servers — it only requests the favicon image, which the
browser would have requested anyway when loading the tab.

## Permissions and why each is needed

- **`tabs`** — to read the list of open tabs and their titles, URLs, and
  favicon URLs; to focus, close, and move tabs at your request.
- **`tabGroups`** — to read which Chrome tab group each tab belongs to and
  to create / modify groups when you use the "Add to group" action.

The extension does not request host permissions for any specific website.

## Contact

Questions? wallace.drew@gmail.com

## Changes to this policy

This page is the canonical version of the privacy policy. Material changes
will bump the "Effective date" above and be visible in the GitHub commit
history at the source repository.
