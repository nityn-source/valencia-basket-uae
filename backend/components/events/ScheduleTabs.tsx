"use client";

import { useState } from "react";
import { type DayTile } from "@/lib/campDays";
import { buildBlocks, clockWithMeridiem, formatDuration, type ScheduleBlock } from "@/lib/scheduleBlocks";
import { Plus, Minus } from "lucide-react";

interface Schedule {
  title: string;
  headers: string[];
  rows: string[][];
}

/** One timetable column as blocks: the day-group heading ("Mon - Thu", "Friday"), or "" when the heading is just "Time". */
interface Column {
  label: string;
  blocks: ScheduleBlock[];
}

/** Every readable time column of a timetable. Empty when any row can't be read, so the plain list shows instead. */
function readColumns(s: Schedule, days: DayTile[] | null | undefined): Column[] {
  const cols: Column[] = [];
  for (let c = 1; c < s.headers.length; c++) {
    const blocks = buildBlocks(s.rows, c);
    if (!blocks) return [];
    const generic = /^(time|times)$/i.test(s.headers[c].trim());
    // A plain "Time" column covers every camp day, so name the days from the programme dates when they're known.
    const label = generic ? (days && days.length > 1 ? `${days[0].label} - ${days[days.length - 1].label}` : "") : s.headers[c];
    cols.push({ label, blocks });
  }
  return cols;
}

const span = (blocks: ScheduleBlock[]) => `${clockWithMeridiem(blocks[0].start)} - ${clockWithMeridiem(blocks[blocks.length - 1].end)}`;

/**
 * One week of the camp: the days and hours in a single line, and the session plan (the training blocks only, with the
 * short breaks folded into one line) behind a button so it takes almost no room until a parent asks for it.
 */
function WeekPanel({ schedule, days, index }: { schedule: Schedule; days: DayTile[] | null | undefined; index: number }) {
  const columns = readColumns(schedule, days);
  const [open, setOpen] = useState(false);
  const [col, setCol] = useState(0);

  if (columns.length === 0) {
    // Times that can't be read: show the rows as they were typed.
    return (
      <ul className="divide-y divide-[#e8e2d6] bg-white">
        {schedule.rows.map((row, r) => (
          <li key={r} className="flex justify-between gap-4 px-4 py-3 text-sm">
            <span className="font-bold">{row[0]}</span>
            <span className="whitespace-nowrap text-[#6b6258]">{row.slice(1).filter(Boolean).join(" · ")}</span>
          </li>
        ))}
      </ul>
    );
  }

  const shown = columns[Math.min(col, columns.length - 1)];
  const training = shown.blocks.filter((b) => !b.isBreak);
  const breaks = shown.blocks.filter((b) => b.isBreak);
  const total = shown.blocks[shown.blocks.length - 1].end - shown.blocks[0].start;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-l-[5px] border-primary bg-white px-4 py-3" data-testid="schedule-summary">
        <span className="text-xl font-black leading-none">{formatDuration(total)}</span>
        <span className="min-w-0 text-sm font-bold">
          {columns.map((c) => (
            <span key={c.label + c.blocks[0].start} className="block">
              {c.label && <>{c.label} <span className="text-primary">·</span> </>}
              {span(c.blocks)}
            </span>
          ))}
        </span>
      </div>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={`sched-plan-${index}`}
        onClick={() => setOpen((v) => !v)}
        className="mt-2.5 flex w-full items-center justify-between border-2 border-black bg-white px-4 py-3 text-xs font-black uppercase tracking-widest transition-colors hover:bg-black hover:text-white"
        data-testid="schedule-reveal"
      >
        {open ? "Hide the session plan" : "Show the session plan"}
        {open ? <Minus className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
      </button>

      {/* Stays in the page HTML while closed. */}
      <div id={`sched-plan-${index}`} hidden={!open} className="mt-2">
        {columns.length > 1 && (
          <div role="group" aria-label="Which days" className="mb-3 flex gap-1.5">
            {columns.map((c, i) => (
              <button
                key={c.label}
                type="button"
                aria-pressed={col === i}
                onClick={() => setCol(i)}
                className={`flex-1 border-2 px-2 py-2 text-xs font-extrabold uppercase tracking-wider ${col === i ? "border-primary bg-primary text-white" : "border-black bg-white text-black hover:border-primary hover:text-primary"}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
        <ol className="relative ml-2 border-l-2 border-primary pl-5" data-testid="schedule-timeline">
          {training.map((b) => (
            <li key={`${b.start}-${b.name}`} className="relative pb-4 last:pb-1">
              <span aria-hidden="true" className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-[#f6f1e8] bg-primary" />
              <div className="text-xs font-extrabold tracking-wide text-primary">{clockWithMeridiem(b.start)}</div>
              <div className="font-black leading-snug">{b.name}</div>
              <div className="text-xs text-[#6b6258]">{b.minutes} min</div>
            </li>
          ))}
        </ol>
        {breaks.length > 0 && (
          <p className="mt-1 text-xs text-[#6b6258]">
            + {breaks.length} short {breaks.length === 1 ? "break" : "breaks"} ({breaks.reduce((n, b) => n + b.minutes, 0)} min in all) for water and a reset.
          </p>
        )}
      </div>
    </div>
  );
}

/** Both weeks stay in the page HTML; the tab only shows one at a time. */
export function ScheduleTabs({ schedules, days }: { schedules: Schedule[]; days?: (DayTile[] | null)[] }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div role="tablist" className="mb-3 flex gap-1.5">
        {schedules.map((s, i) => (
          <button
            key={s.title}
            role="tab"
            id={`sched-tab-${i}`}
            aria-selected={active === i}
            aria-controls={`sched-panel-${i}`}
            onClick={() => setActive(i)}
            className={`flex-1 border-2 border-black px-3 py-3 text-xs font-black uppercase tracking-wider sm:text-sm ${active === i ? "bg-black text-white" : "bg-white text-black"}`}
          >
            {s.title}
          </button>
        ))}
      </div>
      {schedules.map((s, i) => (
        <div key={s.title} role="tabpanel" id={`sched-panel-${i}`} aria-labelledby={`sched-tab-${i}`} hidden={active !== i}>
          <WeekPanel schedule={s} days={days?.[i]} index={i} />
        </div>
      ))}
    </div>
  );
}
