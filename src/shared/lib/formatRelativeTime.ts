const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const MILLIS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;

export function formatRelativeTime(timestamp: number, now: number): string {
  const diffMs = Math.max(0, now - timestamp);
  const seconds = Math.floor(diffMs / MILLIS_PER_SECOND);
  if (seconds < SECONDS_PER_MINUTE) return 'just now';

  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  if (minutes < MINUTES_PER_HOUR) return `${minutes} min ago`;

  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  if (hours < HOURS_PER_DAY) return `${hours} hr ago`;

  const days = Math.floor(hours / HOURS_PER_DAY);
  if (days < DAYS_PER_WEEK) return days === 1 ? '1 day ago' : `${days} days ago`;

  return formatShortDate(new Date(timestamp));
}

function formatShortDate(date: Date): string {
  const month = MONTHS[date.getMonth()] ?? '';
  const day = date.getDate().toString().padStart(2, '0');
  return `${month} ${day}`;
}
