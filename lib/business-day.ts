/**
 * The shop's working day runs from 07:00 to 07:00 the next morning (Vietnam time),
 * split into two shifts:
 *   - Ca sáng: 07:00 – 19:00
 *   - Ca tối:  19:00 – 07:00 the next morning
 * Sales after midnight belong to the previous day's evening shift.
 */
export const VN_TZ = "Asia/Ho_Chi_Minh";
export const VN_UTC_OFFSET_HOURS = 7; // Vietnam has no daylight saving time
export const DAY_START_HOUR = 7;
export const EVENING_SHIFT_START_HOUR = 19;

const HOUR_MS = 3_600_000;

/** Start instant of the working day dated y-m-d (month is 0-based; overflow is fine). */
export function businessDayStart(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m, d, DAY_START_HOUR - VN_UTC_OFFSET_HOURS));
}

/** The working-day date that `instant` belongs to, as UTC fields of a shifted Date. */
export function businessDateOf(instant: Date): { y: number; m: number; d: number; weekday: number } {
  const t = new Date(instant.getTime() + (VN_UTC_OFFSET_HOURS - DAY_START_HOUR) * HOUR_MS);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate(), weekday: t.getUTCDay() };
}

/** Parse "YYYY-MM-DD" into the start of that working day, or null if malformed. */
export function businessDayStartFromString(s: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!match) return null;
  return businessDayStart(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}
