const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatThreadTimestamp(
  value: string | Date,
  now: Date = new Date(),
): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";

  const elapsed = now.getTime() - date.getTime();
  const sameDay = date.toDateString() === now.toDateString();

  if (sameDay) {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const yesterday = new Date(now.getTime() - DAY);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  const days = Math.floor(elapsed / DAY);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;

  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}
export function formatMessageTime(value: string | Date): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return date
    .toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    })
    .toLowerCase();
}

export function formatDayDivider(
  value: string | Date,
  now: Date = new Date(),
): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";

  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now.getTime() - DAY);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export function isSameDay(a: string | Date, b: string | Date): boolean {
  return toDate(a).toDateString() === toDate(b).toDateString();
}
