/**
 * Turns a camp timetable ("5:00 - 5:20 PM", "11:55 AM - 12:00 PM") into blocks for the time bar. Everything is read from
 * the texts already typed in the admin; when any row can't be read the bar simply isn't shown (returns null) and the
 * plain table stays.
 */

export interface ScheduleBlock {
  name: string;
  /** Minutes since midnight. */
  start: number;
  end: number;
  minutes: number;
  isBreak: boolean;
  /** The time exactly as typed, for display. */
  time: string;
}

const RANGE = /^\s*(\d{1,2}):(\d{2})\s*(AM|PM)?\s*[-–]\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*$/i;

function toMinutes(h: number, m: number, meridiem: string): number {
  const base = h % 12;
  return (base + (meridiem.toUpperCase() === "PM" ? 12 : 0)) * 60 + m;
}

/** "5:00 - 5:20 PM" -> [1020, 1040]. A start without AM/PM takes the end's, unless that would put it after the end. */
export function parseTimeRange(text: string): [number, number] | null {
  const m = text.match(RANGE);
  if (!m) return null;
  const endMeridiem = m[6];
  const end = toMinutes(Number(m[4]), Number(m[5]), endMeridiem);
  let start = toMinutes(Number(m[1]), Number(m[2]), m[3] ?? endMeridiem);
  if (!m[3] && start > end) start = toMinutes(Number(m[1]), Number(m[2]), endMeridiem.toUpperCase() === "PM" ? "AM" : "PM");
  return end > start ? [start, end] : null;
}

/** Blocks for one time column of a timetable (col = the column index holding the times). Null when anything can't be read. */
export function buildBlocks(rows: string[][], col: number): ScheduleBlock[] | null {
  if (rows.length === 0 || col < 1) return null;
  const blocks: ScheduleBlock[] = [];
  for (const row of rows) {
    const range = parseTimeRange(row[col] ?? "");
    if (!range || !row[0]) return null;
    blocks.push({ name: row[0], start: range[0], end: range[1], minutes: range[1] - range[0], isBreak: /^break/i.test(row[0]), time: row[col] });
  }
  // The blocks must follow each other in time, or the bar would mislead.
  for (let i = 1; i < blocks.length; i++) if (blocks[i].start < blocks[i - 1].end) return null;
  return blocks;
}

/** "5:00" style clock text (no AM/PM) for the bar's time scale. */
export function clock(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Marks for the time scale: the first start, every whole hour in between, and the last end, with their place on the bar (0–100). */
export function scaleMarks(blocks: ScheduleBlock[]): { label: string; at: number; suffix: string }[] {
  const first = blocks[0].start;
  const last = blocks[blocks.length - 1].end;
  const total = last - first;
  const minutes = new Set<number>([first, last]);
  for (let t = Math.ceil(first / 60) * 60; t < last; t += 60) minutes.add(t);
  return [...minutes]
    .sort((a, b) => a - b)
    .map((t) => ({ label: clock(t), at: ((t - first) / total) * 100, suffix: t === last ? (t >= 12 * 60 && t < 24 * 60 ? " PM" : " AM") : "" }));
}
