import { describe, it, expect } from 'vitest';
import { inferIntent, type Intent } from '../../../src/shared/lib/intents';

describe('inferIntent', () => {
  it.each<readonly [url: string, expected: Intent]>([
    ['https://github.com/foo/bar', 'Dev'],
    ['https://www.npmjs.com/package/foo', 'Dev'],
    ['https://stackoverflow.com/questions/123', 'Dev'],
    ['https://mail.google.com/u/0', 'Comms'],
    ['https://app.slack.com/client', 'Comms'],
    ['https://linear.app/team', 'Comms'],
    ['https://developer.mozilla.org/en-US/docs/Web', 'Reference'],
    ['https://en.wikipedia.org/wiki/Foo', 'Reference'],
    ['https://www.youtube.com/watch?v=abc', 'Entertainment'],
    ['https://twitter.com/foo', 'Entertainment'],
    ['https://x.com/foo', 'Entertainment'],
    ['https://www.amazon.com/dp/B00X', 'Shopping'],
    ['https://example.com/random', 'Other'],
    ['about:blank', 'Other'],
  ])('classifies %s as %s', (url, expected) => {
    expect(inferIntent(url)).toBe(expected);
  });
});
