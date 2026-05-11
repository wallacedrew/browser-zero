import { describe, it, expect } from 'vitest';
import { extractDomain } from '../../../src/shared/lib/extractDomain';

describe('extractDomain', () => {
  it('returns the hostname for an https URL', () => {
    expect(extractDomain('https://github.com/foo/bar')).toBe('github.com');
  });

  it('strips the www. prefix', () => {
    expect(extractDomain('https://www.youtube.com/watch?v=abc')).toBe('youtube.com');
  });

  it('preserves subdomains other than www', () => {
    expect(extractDomain('https://mail.google.com/u/0')).toBe('mail.google.com');
  });

  it('returns (internal) for about:blank', () => {
    expect(extractDomain('about:blank')).toBe('(internal)');
  });

  it('returns (internal) for a malformed URL', () => {
    expect(extractDomain('not a url at all')).toBe('(internal)');
  });
});
