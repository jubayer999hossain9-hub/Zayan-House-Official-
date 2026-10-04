/** Value for <input type="datetime-local"> in Bangladesh time (UTC+6, no daylight saving). */
export function toLocalInput(d: Date | null): string {
  if (!d) return "";
  return new Date(d.getTime() + 6 * 3600_000).toISOString().slice(0, 16);
}
