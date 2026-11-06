import assert from "node:assert/strict";
import test from "node:test";
import { buildDays, campStart, compactDates, parseDateRange, parseSessionTimes, parseWeekdays } from "@/lib/campDays";

test("a date range is read from the camp's own wording", () => {
  const [start, end] = parseDateRange("7th Dec 2026 - 11th Dec 2026")!;
  assert.equal(start.toISOString().slice(0, 10), "2026-12-07");
  assert.equal(end.toISOString().slice(0, 10), "2026-12-11");
  assert.equal(parseDateRange("no dates here"), null);
});

test("session times map to weekdays, including 'X to Y' ranges", () => {
  const times = parseSessionTimes(["Monday to Thursday: 5:00 PM - 8:00 PM", "Friday: 3:00 PM - 6:00 PM"]);
  assert.equal(times.get(1), "5:00 PM - 8:00 PM");
  assert.equal(times.get(4), "5:00 PM - 8:00 PM");
  assert.equal(times.get(5), "3:00 PM - 6:00 PM");
  assert.equal(times.has(6), false);
});

test("day tiles cover the camp days with their own times", () => {
  const days = buildDays("7th Dec 2026 - 11th Dec 2026", ["Monday to Thursday: 5:00 PM - 8:00 PM", "Friday: 3:00 PM - 6:00 PM"])!;
  assert.deepEqual(days.map((d) => `${d.label} ${d.date}`), ["Mon 7", "Tue 8", "Wed 9", "Thu 10", "Fri 11"]);
  assert.equal(days[4].time, "3:00 PM - 6:00 PM");
});

test("unreadable texts give no tiles and no start date rather than wrong ones", () => {
  assert.equal(buildDays("TBC", ["Evenings"]), null);
  assert.equal(campStart("", ["TBC"]), null);
  assert.equal(campStart("2026-12-07", []), "2026-12-07");
  assert.equal(campStart("", ["7th Dec 2026 - 11th Dec 2026"]), "2026-12-07");
});

test("timetable column headings map to the days they cover", () => {
  assert.deepEqual([...parseWeekdays("Mon - Thu")!], [1, 2, 3, 4]);
  assert.deepEqual([...parseWeekdays("Friday")!], [5]);
  assert.equal(parseWeekdays("Time"), null);
  assert.equal(parseWeekdays("Session"), null);
});

test("dates are shortened for chips and phone headers without losing the range", () => {
  assert.equal(compactDates("7th Dec 2026 - 11th Dec 2026"), "7th - 11th Dec");
  assert.equal(compactDates("7th - 18th Dec 2026 (10 days)"), "7th - 18th Dec");
  assert.equal(compactDates("28th Dec 2026 - 2nd Jan 2027"), "28th Dec - 2nd Jan");
});
