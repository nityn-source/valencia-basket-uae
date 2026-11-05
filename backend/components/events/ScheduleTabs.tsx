"use client";

import { useState } from "react";

interface Schedule {
  title: string;
  headers: string[];
  rows: string[][];
}

/** Both timetables stay in the page HTML; the tab only shows one at a time. */
export function ScheduleTabs({ schedules }: { schedules: Schedule[] }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div role="tablist" className="mb-0 flex gap-1.5">
        {schedules.map((s, i) => (
          <button
            key={s.title}
            role="tab"
            id={`sched-tab-${i}`}
            aria-selected={active === i}
            aria-controls={`sched-panel-${i}`}
            onClick={() => setActive(i)}
            className={`flex-1 border-2 border-black px-3 py-3.5 text-xs font-black uppercase tracking-wider sm:text-sm ${active === i ? "bg-black text-white" : "bg-white text-black"}`}
          >
            {s.title}
          </button>
        ))}
      </div>
      {schedules.map((s, i) => (
        <div
          key={s.title}
          role="tabpanel"
          id={`sched-panel-${i}`}
          aria-labelledby={`sched-tab-${i}`}
          hidden={active !== i}
          className="border-2 border-t-0 border-black bg-white"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#f6f1e8] text-[11px] font-black uppercase tracking-widest max-sm:hidden">
                  {s.headers.map((h) => (
                    <th key={h} scope="col" className="px-4 py-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.rows.map((row, r) => {
                  const isBreak = /^break/i.test(row[0] ?? "");
                  return (
                    <tr key={r} className={`border-t border-[#e8e2d6] max-sm:block max-sm:px-4 max-sm:py-3 ${isBreak ? "italic text-[#8a8175]" : ""}`}>
                      {row.map((cell, c) => (
                        <td
                          key={c}
                          data-label={s.headers[c] ?? ""}
                          className={`px-4 py-3 max-sm:block max-sm:px-0 max-sm:py-0.5 ${c === 0 ? "max-sm:font-bold" : "whitespace-nowrap max-sm:before:mr-2 max-sm:before:text-[11px] max-sm:before:font-bold max-sm:before:uppercase max-sm:before:tracking-wider max-sm:before:text-[#8a8175] max-sm:before:content-[attr(data-label)]"} ${c > 0 && !isBreak ? "font-bold" : ""}`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
