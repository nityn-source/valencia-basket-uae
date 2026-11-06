"use client";

import { useEffect, useState } from "react";

/** Time left until the camp starts (UAE midnight on `start`, YYYY-MM-DD). Ticks every second; vanishes once it has started. */
function useRemaining(start: string) {
  const target = new Date(`${start}T00:00:00+04:00`).getTime();
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setLeft(target - Date.now());
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [target]);
  return left;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function CampCountdown({ start, variant = "tiles" }: { start: string; variant?: "tiles" | "bar" }) {
  const left = useRemaining(start);
  if (left !== null && left <= 0) return null;
  const secs = left === null ? null : Math.floor(left / 1000);
  const parts = [
    { label: "Days", value: secs === null ? "–" : String(Math.floor(secs / 86400)) },
    { label: "Hrs", value: secs === null ? "–" : pad(Math.floor((secs % 86400) / 3600)) },
    { label: "Min", value: secs === null ? "–" : pad(Math.floor((secs % 3600) / 60)) },
    { label: "Sec", value: secs === null ? "–" : pad(secs % 60) },
  ];

  if (variant === "bar") {
    const days = secs === null ? null : Math.floor(secs / 86400);
    const text = days === null ? "" : days >= 1 ? `STARTS IN ${days} DAY${days === 1 ? "" : "S"}` : `STARTS IN ${parts[1].value}H ${parts[2].value}M`;
    return (
      <span className="block text-[10px] font-extrabold tracking-[0.14em] text-black/70" aria-hidden="true">
        {text}
      </span>
    );
  }

  return (
    <div className="mt-6" role="timer" aria-label="Time until the camp starts" data-testid="camp-countdown">
      <div className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#6b6258]">Camp starts in</div>
      <div className="flex gap-2">
        {parts.map((p) => (
          <div key={p.label} className="w-[62px] bg-[#111] py-2.5 text-center text-white sm:w-[72px]">
            <span key={p.value} className="camp-tick block text-2xl font-black leading-none tabular-nums sm:text-3xl">{p.value}</span>
            <small className="mt-1 block text-[9px] font-extrabold uppercase tracking-[0.16em] text-primary">{p.label}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
