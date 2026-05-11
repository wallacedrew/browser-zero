import { extractDomain } from './extractDomain';

export type Intent = 'Dev' | 'Comms' | 'Reference' | 'Entertainment' | 'Shopping' | 'Other';

const DOMAIN_INTENT_RULES: ReadonlyArray<readonly [pattern: string, intent: Intent]> = [
  ['mail.google.com', 'Comms'],
  ['calendar.google.com', 'Comms'],
  ['slack.com', 'Comms'],
  ['linear.app', 'Comms'],
  ['notion.so', 'Comms'],
  ['github.com', 'Dev'],
  ['gitlab.com', 'Dev'],
  ['stackoverflow.com', 'Dev'],
  ['codepen.io', 'Dev'],
  ['npmjs.com', 'Dev'],
  ['developer.mozilla.org', 'Reference'],
  ['wikipedia.org', 'Reference'],
  ['youtube.com', 'Entertainment'],
  ['twitch.tv', 'Entertainment'],
  ['reddit.com', 'Entertainment'],
  ['twitter.com', 'Entertainment'],
  ['x.com', 'Entertainment'],
  ['netflix.com', 'Entertainment'],
  ['amazon.com', 'Shopping'],
  ['ebay.com', 'Shopping'],
  ['etsy.com', 'Shopping'],
];

export function inferIntent(url: string): Intent {
  const host = extractDomain(url);
  for (const [pattern, intent] of DOMAIN_INTENT_RULES) {
    if (host === pattern || host.endsWith('.' + pattern)) return intent;
  }
  return 'Other';
}
