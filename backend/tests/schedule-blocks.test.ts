import assert from "node:assert/strict";
import test from "node:test";
import { buildBlocks, clock, parseTimeRange, scaleMarks } from "@/lib/scheduleBlocks";

test("time ranges are read, taking AM or PM from the end when the start has none", () => {
  assert.deepEqual(parseTimeRange("5:00 - 5:20 PM"), [17 * 60, 17 * 60 + 20]);
  assert.deepEqual(parseTimeRange("11:55 AM - 12:00 PM"), [11 * 60 + 55, 12 * 60]);
  assert.deepEqual(parseTimeRange("11:30 - 12:10 PM"), [11 * 60 + 30, 12 * 60 + 10]);
  assert.equal(parseTimeRange("Evenings"), null);
});

const rows = [
  ["Warm-Up & Activation", "5:00 - 5:20 PM"],
  ["Elite Ball Handling", "5:20 - 6:00 PM"],
  ["Break: Hydration", "6:00 - 6:07 PM"],
  ["Live Games", "6:07 - 8:00 PM"],
];

test("rows become blocks with their minutes, and breaks are marked", () => {
  const blocks = buildBlocks(rows, 1)!;
  assert.equal(blocks.length, 4);
  assert.deepEqual(blocks.map((b) => b.minutes), [20, 40, 7, 113]);
  assert.deepEqual(blocks.map((b) => b.isBreak), [false, false, true, false]);
});

test("a timetable that can't be read, or overlaps, gives no bar rather than a wrong one", () => {
  assert.equal(buildBlocks([["A", "TBC"]], 1), null);
  assert.equal(buildBlocks([["A", "5:00 - 6:00 PM"], ["B", "5:30 - 6:30 PM"]], 1), null);
  assert.equal(buildBlocks([], 1), null);
});

test("the time scale marks the start, each whole hour and the end", () => {
  const marks = scaleMarks(buildBlocks(rows, 1)!);
  assert.deepEqual(marks.map((m) => m.label), ["5:00", "6:00", "7:00", "8:00"]);
  assert.equal(marks[0].at, 0);
  assert.equal(marks[3].at, 100);
  assert.equal(marks[3].suffix, " PM");
  assert.equal(clock(9 * 60), "9:00");
  assert.equal(clock(12 * 60 + 5), "12:05");
});
