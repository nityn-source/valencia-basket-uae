/**
 * Dates for the camp page: the day tiles above each timetable and the "starts in" countdown.
 * Everything is read from the texts already typed in the admin ("7th Dec 2026 - 11th Dec 2026",
 * "Monday to Thursday: 5:00 PM - 8:00 PM"), so there is nothing extra to fill in. When a text can't be
 * read the feature simply stays out of the way (returns null).
 */

export interface DayTile {
  /** Weekday number, 0 = Sunday. */
  weekday: number;
  /** Mon, Tue, ... */
  label: string;
  /** Day of the month, e.g. "7". */
  date: string;
  /** Short month, e.g. "Dec". */
  month: string;
  /** Session time for that weekday, or null when there is no session. */
  time: string | null;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_DAYS = 7;

/** "7th Dec 2026 - 11th Dec 2026" -> [start, end] as UTC dates. A single date gives one date twice. */
export function parseDateRange(text: string): [Date, Date] | null {
  const found = [...text.matchAll(/(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3})[A-Za-z]*\.?\s+(\d{4})/g)];
  const dates = found
    .map((m) => {
      const month = MONTHS.indexOf(m[2].toLowerCase());
      return month < 0 ? null : new Date(Date.UTC(Number(m[3]), month, Number(m[1])));
    })
    .filter((d): d is Date => d !== null);
  if (dates.length === 0) return null;
  return [dates[0], dates[dates.length > 1 ? 1 : 0]];
}

/** "Monday to Thursday: 5:00 PM - 8:00 PM" and "Friday: 3:00 PM - 6:00 PM" -> time by weekday index (0 = Sunday). */
export function parseSessionTimes(lines: string[]): Map<number, string> {
  const times = new Map<number, string>();
  for (const line of lines) {
    const m = line.match(/^\s*([A-Za-z]{3})[A-Za-z]*(?:\s*(?:to|-|–)\s*([A-Za-z]{3})[A-Za-z]*)?\s*:\s*(.+?)\s*$/);
    if (!m) continue;
    const from = WEEKDAYS.indexOf(m[1].toLowerCase());
    const to = m[2] ? WEEKDAYS.indexOf(m[2].toLowerCase()) : from;
    if (from < 0 || to < 0) continue;
    for (let d = from, guard = 0; guard < 7; guard++, d = (d + 1) % 7) {
      times.set(d, m[3]);
      if (d === to) break;
    }
  }
  return times;
}

/** A timetable column heading such as "Mon - Thu" or "Friday" -> the weekdays it covers, or null for headings like "Time". */
export function parseWeekdays(header: string): Set<number> | null {
  const m = header.match(/^\s*([A-Za-z]{3})[A-Za-z]*(?:\s*(?:to|-|–)\s*([A-Za-z]{3})[A-Za-z]*)?\s*$/);
  if (!m) return null;
  const from = WEEKDAYS.indexOf(m[1].toLowerCase());
  const to = m[2] ? WEEKDAYS.indexOf(m[2].toLowerCase()) : from;
  if (from < 0 || to < 0) return null;
  const days = new Set<number>();
  for (let d = from, guard = 0; guard < 7; guard++, d = (d + 1) % 7) {
    days.add(d);
    if (d === to) break;
  }
  return days;
}

export function buildDays(dates: string, timeLines: string[]): DayTile[] | null {
  const range = parseDateRange(dates);
  if (!range) return null;
  const [start, end] = range;
  const times = parseSessionTimes(timeLines);
  if (times.size === 0) return null;
  const days: DayTile[] = [];
  for (let t = start.getTime(); t <= end.getTime() && days.length < MAX_DAYS; t += 86_400_000) {
    const day = new Date(t);
    const wd = day.getUTCDay();
    // Weekends are left out unless a session is listed for them.
    if ((wd === 0 || wd === 6) && !times.has(wd)) continue;
    days.push({ weekday: wd, label: WEEKDAY_LABELS[wd], date: String(day.getUTCDate()), month: MONTH_LABELS[day.getUTCMonth()], time: times.get(wd) ?? null });
  }
  return days.length > 0 && days.some((d) => d.time) ? days : null;
}

/** First day of the camp as YYYY-MM-DD: the admin's start date, else read from the first dates text. */
export function campStart(startDate: string, fallbackTexts: string[]): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return startDate;
  for (const text of fallbackTexts) {
    const range = parseDateRange(text);
    if (range) return range[0].toISOString().slice(0, 10);
  }
  return null;
}

/** "7th Dec 2026 - 11th Dec 2026" -> "7th - 11th Dec" (years dropped, a shared month said once), for tight spaces like chips. */
export function compactDates(text: string): string {
  const noYear = text.replace(/\s+\d{4}\b/g, "").replace(/\s*\([^)]*\)\s*$/, "").trim();
  const same = noYear.match(/^(\d{1,2}(?:st|nd|rd|th)?)\s+([A-Za-z]+)\s*[-–]\s*(\d{1,2}(?:st|nd|rd|th)?)\s+\2$/i);
  return same ? `${same[1]} - ${same[3]} ${same[2]}` : noYear;
}
