import type { Tab } from '../../shared/lib/types';
import { Timestamp } from '../../shared/lib/Timestamp';
import { extractDomain } from '../../shared/lib/extractDomain';

// Curated fixture for screenshots / demo mode. Anchored to a fixed
// reference time (`demoNow`) so screenshots are deterministic across runs.
// Favicons are fetched via Google's s2 favicon proxy so the screenshot
// shows real domain marks instead of grey placeholders.
//
// NB: demoNow can be passed to <App now={demoNow} /> so "5 min ago",
// "1 hr ago", "yesterday" all line up with the fixture's lastAccessed.

export const demoNowMillis = new Date(2026, 4, 11, 14, 0, 0).getTime();
export const demoNow = Timestamp.fromMillis(demoNowMillis);
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const faviconFor = (url: string): string =>
  `https://www.google.com/s2/favicons?domain=${encodeURIComponent(extractDomain(url))}&sz=32`;

interface TabSpec {
  id: number;
  windowId: number;
  title: string;
  url: string;
  ageMs: number;
  group: Tab['group'];
}

const specs: ReadonlyArray<TabSpec> = [
  // -------- Window 1 (workId 100): "work / coding" -------------------------
  {
    id: 1,
    windowId: 100,
    title: 'browser-zero — pull request #42',
    url: 'https://github.com/wallacedrew/browser-zero/pull/42',
    ageMs: 3 * MINUTE,
    group: { id: 1, title: 'Shipping', color: 'blue' },
  },
  {
    id: 2,
    windowId: 100,
    title: 'CI / build #127 · browser-zero',
    url: 'https://github.com/wallacedrew/browser-zero/actions/runs/127',
    ageMs: 4 * MINUTE,
    group: { id: 1, title: 'Shipping', color: 'blue' },
  },
  {
    id: 3,
    windowId: 100,
    title: 'Chrome Web Store - Developer Dashboard',
    url: 'https://chrome.google.com/webstore/devconsole',
    ageMs: 12 * MINUTE,
    group: { id: 1, title: 'Shipping', color: 'blue' },
  },
  {
    id: 4,
    windowId: 100,
    title: 'chrome.tabs - Chrome for Developers',
    url: 'https://developer.chrome.com/docs/extensions/reference/api/tabs',
    ageMs: 22 * MINUTE,
    group: { id: 2, title: 'Reading', color: 'green' },
  },
  {
    id: 5,
    windowId: 100,
    title: 'chrome.tabGroups - Chrome for Developers',
    url: 'https://developer.chrome.com/docs/extensions/reference/api/tabGroups',
    ageMs: 25 * MINUTE,
    group: { id: 2, title: 'Reading', color: 'green' },
  },
  {
    id: 6,
    windowId: 100,
    title: 'Manifest file format - Chrome for Developers',
    url: 'https://developer.chrome.com/docs/extensions/reference/manifest',
    ageMs: 28 * MINUTE,
    group: { id: 2, title: 'Reading', color: 'green' },
  },
  {
    id: 7,
    windowId: 100,
    title: 'React - The library for web and native user interfaces',
    url: 'https://react.dev/',
    ageMs: 45 * MINUTE,
    group: { id: 2, title: 'Reading', color: 'green' },
  },
  {
    id: 8,
    windowId: 100,
    title: 'Vite | Next Generation Frontend Tooling',
    url: 'https://vitejs.dev/',
    ageMs: 47 * MINUTE,
    group: { id: 2, title: 'Reading', color: 'green' },
  },
  {
    id: 9,
    windowId: 100,
    title: 'Tailwind CSS - Rapidly build modern websites',
    url: 'https://tailwindcss.com/',
    ageMs: 52 * MINUTE,
    group: null,
  },
  {
    id: 10,
    windowId: 100,
    title: 'Stack Overflow - chrome.tabs.query returns empty array',
    url: 'https://stackoverflow.com/questions/12345678/chrome-tabs-query-returns-empty-array',
    ageMs: 55 * MINUTE,
    group: null,
  },
  {
    id: 11,
    windowId: 100,
    title: 'Vitest - Next Generation Testing Framework',
    url: 'https://vitest.dev/',
    ageMs: 1 * HOUR + 5 * MINUTE,
    group: null,
  },
  {
    id: 12,
    windowId: 100,
    title: 'Testing Library | Testing Library',
    url: 'https://testing-library.com/docs/react-testing-library/intro',
    ageMs: 1 * HOUR + 10 * MINUTE,
    group: null,
  },
  {
    id: 13,
    windowId: 100,
    title: 'GitHub Pages - GitHub Docs',
    url: 'https://docs.github.com/en/pages',
    ageMs: 2 * HOUR,
    group: null,
  },
  {
    id: 14,
    windowId: 100,
    title: 'Linear — Issue ENG-238: tab-group color drift',
    url: 'https://linear.app/team/issue/ENG-238',
    ageMs: 2 * HOUR + 30 * MINUTE,
    group: null,
  },
  {
    id: 15,
    windowId: 100,
    title: '#engineering | Slack',
    url: 'https://acme.slack.com/archives/C0123456789',
    ageMs: 3 * HOUR,
    group: null,
  },
  // -------- Window 2 (workId 200): "reading / personal" -------------------
  {
    id: 16,
    windowId: 200,
    title: 'The Pragmatic Engineer - Latest issue',
    url: 'https://newsletter.pragmaticengineer.com/p/latest',
    ageMs: 6 * MINUTE,
    group: { id: 3, title: 'Read later', color: 'yellow' },
  },
  {
    id: 17,
    windowId: 200,
    title: 'Hacker News',
    url: 'https://news.ycombinator.com/',
    ageMs: 15 * MINUTE,
    group: { id: 3, title: 'Read later', color: 'yellow' },
  },
  {
    id: 18,
    windowId: 200,
    title: 'Show HN: I built a tab manager for Chrome',
    url: 'https://news.ycombinator.com/item?id=99999999',
    ageMs: 17 * MINUTE,
    group: { id: 3, title: 'Read later', color: 'yellow' },
  },
  {
    id: 19,
    windowId: 200,
    title: 'Anthropic — Building agents with Claude',
    url: 'https://www.anthropic.com/engineering/building-effective-agents',
    ageMs: 40 * MINUTE,
    group: { id: 3, title: 'Read later', color: 'yellow' },
  },
  {
    id: 20,
    windowId: 200,
    title: 'YouTube',
    url: 'https://www.youtube.com/',
    ageMs: 1 * HOUR + 20 * MINUTE,
    group: null,
  },
  {
    id: 21,
    windowId: 200,
    title: 'Inbox (12) - gmail',
    url: 'https://mail.google.com/mail/u/0/#inbox',
    ageMs: 2 * HOUR + 5 * MINUTE,
    group: null,
  },
  {
    id: 22,
    windowId: 200,
    title: 'Google Calendar - Today',
    url: 'https://calendar.google.com/calendar/u/0/r/day',
    ageMs: 3 * HOUR + 15 * MINUTE,
    group: null,
  },
  {
    id: 23,
    windowId: 200,
    title: 'Notion - Personal home',
    url: 'https://www.notion.so/me/Personal-Home',
    ageMs: 5 * HOUR,
    group: { id: 4, title: 'Errands', color: 'orange' },
  },
  {
    id: 24,
    windowId: 200,
    title: 'Amazon.com: Order details',
    url: 'https://www.amazon.com/gp/your-account/order-details',
    ageMs: 6 * HOUR,
    group: { id: 4, title: 'Errands', color: 'orange' },
  },
  {
    id: 25,
    windowId: 200,
    title: 'United Airlines - Booking confirmation',
    url: 'https://www.united.com/en/us/manageres',
    ageMs: 7 * HOUR + 30 * MINUTE,
    group: { id: 4, title: 'Errands', color: 'orange' },
  },
  {
    id: 26,
    windowId: 200,
    title: 'r/programming',
    url: 'https://www.reddit.com/r/programming/',
    ageMs: 1 * DAY,
    group: null,
  },
  {
    id: 27,
    windowId: 200,
    title: 'Wikipedia: Single-page application',
    url: 'https://en.wikipedia.org/wiki/Single-page_application',
    ageMs: 1 * DAY + 4 * HOUR,
    group: null,
  },
  {
    id: 28,
    windowId: 200,
    title: 'Figma — Design draft v3',
    url: 'https://www.figma.com/file/abc123/Design-Draft-v3',
    ageMs: 2 * DAY,
    group: null,
  },
  {
    id: 29,
    windowId: 200,
    title: 'Spotify — Web Player: Music for everyone',
    url: 'https://open.spotify.com/',
    ageMs: 2 * DAY + 6 * HOUR,
    group: null,
  },
  {
    id: 30,
    windowId: 200,
    title: 'Twitter / X — Home',
    url: 'https://x.com/home',
    ageMs: 3 * DAY,
    group: null,
  },
];

export const demoTabs: readonly Tab[] = specs.map((spec) => ({
  id: spec.id,
  windowId: spec.windowId,
  title: spec.title,
  url: spec.url,
  domain: extractDomain(spec.url),
  favIconUrl: faviconFor(spec.url),
  lastAccessed: Timestamp.fromMillis(demoNowMillis - spec.ageMs),
  group: spec.group,
}));
