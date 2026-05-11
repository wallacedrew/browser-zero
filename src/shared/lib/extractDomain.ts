export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '') || '(internal)';
  } catch {
    return '(internal)';
  }
}
