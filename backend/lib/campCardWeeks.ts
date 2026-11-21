import type { CampDetails } from "@shared/campDetails";

export type CampCardWeek = { label: string; name: string; focus: string; times: string; fee: string };
export type CampCardBundle = { text: string; save: string };
export type CampCardSummary = { ages: string; weeks: CampCardWeek[]; bundle: CampCardBundle | null };

const DAYS: Record<string, string> = { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" };

/** "7th Dec 2026 - 11th Dec 2026" -> "7th - 11th Dec". Anything it can't read is returned as it was written. */
export function shortDates(dates: string): string {
  const match = dates.trim().match(/^(\d{1,2}(?:st|nd|rd|th)?)\s+([A-Za-z]+)(?:\s+\d{4})?\s*[-–]\s*(\d{1,2}(?:st|nd|rd|th)?)\s+([A-Za-z]+)(?:\s+\d{4})?$/);
  if (!match) return dates.trim();
  const [, from, fromMonth, to, toMonth] = match;
  return fromMonth.toLowerCase() === toMonth.toLowerCase() ? `${from} – ${to} ${toMonth}` : `${from} ${fromMonth} – ${to} ${toMonth}`;
}

/** "Monday to Thursday: 5:00 PM - 8:00 PM" -> "Mon–Thu 5–8 PM". Anything it can't read is returned as it was written. */
export function shortTimeLine(line: string): string {
  const text = line.trim();
  const match = text.match(/^([A-Za-z]+)(?:\s+(?:to|-|–)\s+([A-Za-z]+))?\s*:\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!match) return text;
  const [, dayA, dayB, h1, m1, ap1, h2, m2, ap2] = match;
  const a = DAYS[dayA.toLowerCase()];
  const b = dayB ? DAYS[dayB.toLowerCase()] : undefined;
  if (!a || (dayB && !b)) return text;
  const clock = (h: string, m?: string) => (m && m !== "00" ? `${h}:${m}` : h);
  const end = ap2.toUpperCase();
  const start = ap1 && ap1.toUpperCase() !== end ? `${clock(h1, m1)} ${ap1.toUpperCase()}` : clock(h1, m1);
  return `${b ? `${a}–${b}` : a} ${start}–${clock(h2, m2)} ${end}`;
}

/**
 * What an event card shows for a camp: one box per week (dates, focus, times, fee), then the both-weeks
 * price. Everything is read from the camp page, so editing the camp page updates the card.
 */
export function campCardSummary(details: CampDetails | null | undefined): CampCardSummary | null {
  if (!details) return null;
  const weeks = details.programmes
    .filter((programme) => programme.weekLabel || programme.timeLines.length > 0)
    .map((programme) => ({
      label: [programme.weekLabel.trim(), shortDates(programme.dates)].filter(Boolean).join(" · "),
      name: programme.name.trim(),
      focus: programme.tagline.trim(),
      times: programme.timeLines.map(shortTimeLine).filter(Boolean).join(" · "),
      fee: programme.fee.trim(),
    }))
    .filter((week) => week.name);
  if (weeks.length === 0) return null;
  const range = details.openFor.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})/);
  const best = details.fees.rows.find((row) => row.best && row.fee.trim());
  const save = details.fees.note.match(/save\s+((?:AED\s*)?[\d,]+)/i)?.[1]?.trim() ?? "";
  return {
    ages: range ? `Ages ${range[1]}–${range[2]}` : "",
    weeks,
    bundle: best ? { text: `Both weeks: ${best.fee.trim()}`, save: save ? `save ${/^AED/i.test(save) ? save : `AED ${save}`}` : "" } : null,
  };
}
