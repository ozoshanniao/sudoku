/**
 * Formats a Date object into a local YYYY-MM-DD string.
 * This avoids time zone shifts that can occur with toISOString().slice(0, 10).
 */
export function formatLocalDateKey(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Returns the local YYYY-MM-DD string for the day immediately preceding the given date.
 * Correctly handles month boundaries, year boundaries, and leap years.
 */
export function getPreviousLocalDateKey(date: Date): string {
  const prevDate = new Date(date);
  prevDate.setDate(prevDate.getDate() - 1);
  return formatLocalDateKey(prevDate);
}
