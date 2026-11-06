"use client";

import { ArrowRight } from "lucide-react";
import { chooseCamp } from "@/lib/campPick";

/** "Reserve this week": picks the camp in the registration form and scrolls down to it. */
export function CampReserveButton({ id, label }: { id: string; label: string }) {
  return (
    <a
      href="#register"
      onClick={(e) => {
        e.preventDefault();
        chooseCamp(id);
      }}
      className="group mt-6 inline-flex items-center gap-2 bg-black px-6 py-3 text-xs font-extrabold uppercase tracking-widest text-white transition-colors hover:bg-primary"
    >
      {label} <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden="true" />
    </a>
  );
}
