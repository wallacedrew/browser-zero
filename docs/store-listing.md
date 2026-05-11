# Chrome Web Store listing — browser-zero

Copy each block below into the corresponding field in the Web Store dev
console at https://chrome.google.com/webstore/devconsole.

## Item details

- **Name**: `browser-zero`
- **Visibility**: Public
- **Category**: Productivity
- **Language**: English

## Short description (≤132 characters)

```
Every open tab across every Chrome window on one screen — search, group, drag between windows, bulk close.
```

## Detailed description

```
browser-zero is the single screen for every tab you have open.

Open the toolbar icon and see every tab across every Chrome window in one
list. Search, group, drag tabs between windows, and bulk-close — without
hunting through windows or rummaging through tab strips.

WHAT YOU CAN DO

• See everything. Every open tab in every Chrome window, with title, domain,
  favicon, and how long ago you last touched it.
• Search instantly. Type to filter by title, URL, domain, or group name.
• Group however you think. Switch between "by window", "by tab group", or
  "by domain in url" with one click.
• Drag tabs between windows. Drag any row to another window's section to
  move that tab. Drag onto a tab-group section to assign it; drag to the
  Ungrouped section to remove it from its group.
• Bulk-close with confirmation. Per-section "Select all" + a big red
  "Close?" button, with a confirm dialog before anything actually closes.
• A built-in safety net. browser-zero will never let you close the very
  last open tab in Chrome — it opens a fresh new-tab page first.
• Add tabs to groups, fast. Multi-select and either name a new Chrome tab
  group or pick an existing one from a menu.
• Stays out of your way. No accounts, no settings to configure, no data
  leaves your machine. The whole dashboard is stateless and re-reads from
  Chrome every time you open it.

PRIVACY

browser-zero does not transmit any data anywhere. There is no telemetry,
no analytics, no cloud sync, no error reporting, no third-party SDKs.
Everything runs locally in your browser. See the privacy policy for the
exact list of what Chrome APIs the extension reads and why.

WHO BUILT IT

Built by Drew Wallace as a tool I wanted for myself. Source available on
GitHub.
```

## Single-purpose description

The Web Store requires a one-line statement of the extension's single
purpose. Paste:

```
Display and manage every open Chrome tab across every window from a single dashboard page.
```

## Permission justifications

The dev console asks for a justification per permission. Use:

### `tabs` permission

```
Required to read the list of open tabs (title, URL, favicon, last-accessed time, window, group) so the dashboard can display them, and to focus, close, and move tabs in response to user clicks and drags. The extension does not send tab data anywhere — it only reads from chrome.tabs and acts on user input.
```

### `tabGroups` permission

```
Required to read which Chrome tab group each tab belongs to (so the "By tab group" view can render group names and colors) and to create new groups or assign tabs to existing groups when the user triggers the bulk "Add to group" action.
```

### Host permissions

None requested. Leave blank or "N/A" if prompted.

### Remote code

```
No. The extension bundles all of its code at build time; nothing is loaded at runtime from a remote server.
```

## Data usage disclosures

The dev console asks a series of yes/no questions about user data. For
browser-zero:

| Question                                     | Answer |
| -------------------------------------------- | ------ |
| Collects personally identifiable information | No     |
| Collects health information                  | No     |
| Collects financial and payment information   | No     |
| Collects authentication information          | No     |
| Collects personal communications             | No     |
| Collects location                            | No     |
| Collects web history                         | No\*   |
| Collects user activity                       | No\*   |
| Collects website content                     | No\*   |

\* The extension reads tab titles and URLs from `chrome.tabs.query` to
display them in the dashboard, but it does not store them, transmit them,
or share them with any third party. The dev console considers data
"collected" only if it leaves the user's machine; under that definition
nothing is collected.

Confirm the certification statements:

- [x] I do not sell or transfer user data to third parties for purposes
      unrelated to the item's single purpose.
- [x] I do not use or transfer user data to determine creditworthiness or
      for lending purposes.
- [x] I do not use or transfer user data for purposes unrelated to the
      item's single purpose.

## Privacy policy URL

After enabling GitHub Pages on the repo (Settings → Pages → "Deploy from
a branch" → `main` branch, `/docs` folder), paste:

```
https://<github-username>.github.io/browser-zero/privacy-policy/
```

Replace `<github-username>` with your actual GitHub handle.

## Assets to upload

- **Store icon**: `src/dashboard/assets/icon-128.png` (already 128×128)
- **Screenshots** (1–5, 1280×800 or 640×400): grab manually after loading
  `dist/` unpacked. Suggested shots: (1) by-window view with 20+ tabs
  across 2+ windows, (2) bulk-select with the Close? + Add to group action
  panel visible, (3) by-tab-group view, (4) the "Add to group" picker open
  with the name input + an existing-group list.
- **Promo tile** (440×280): optional. Skip for first submission; can be
  added later.

## Upload zip

Build and zip from the repo root:

```bash
pnpm build
(cd dist && zip -r ../browser-zero-0.0.1.zip .)
```

The resulting `browser-zero-0.0.1.zip` has the full `dist/` tree at the
zip root — that's what the Web Store expects.
