"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

/** An on/off switch for a Page Content field of type "toggle" ("on" / "off"). */
export function SwitchButton({ on, onChange, disabled, label, testId }: { on: boolean; onChange: (next: boolean) => void; disabled?: boolean; label: string; testId?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      data-testid={testId}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${on ? "bg-[#FF6C0E]" : "bg-gray-300"}`}
    >
      <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

/** Saves a toggle field straight away through the Page Content API. */
export function useToggleSave(contentKey: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (on: boolean) => {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key: contentKey, value: on ? "on" : "off" }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Unable to save");
      return on;
    },
    onSuccess: (on) => {
      queryClient.invalidateQueries({ queryKey: ["admin-page-content"] });
      queryClient.invalidateQueries({ queryKey: ["admin-content-toggle", contentKey] });
      toast({ title: on ? "Section is now shown on the homepage" : "Section is now hidden from the homepage" });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });
}

/** A labelled show/hide switch for a whole homepage section, with a line saying what it does right now. */
export function SectionSwitch({ contentKey, title, onText, offText }: { contentKey: string; title: string; onText: string; offText: string }) {
  const save = useToggleSave(contentKey);
  const { data } = useQuery<boolean>({
    queryKey: ["admin-content-toggle", contentKey],
    queryFn: async () => {
      const res = await fetch(`/api/admin/content?key=${encodeURIComponent(contentKey)}`);
      if (!res.ok) throw new Error("Failed to load");
      const rows = (await res.json()) as { value: string }[];
      return rows[0]?.value !== "off";
    },
  });
  const on = data ?? true;

  return (
    <div className="flex items-center gap-4 border border-gray-200 bg-white px-4 py-3" data-testid="section-switch">
      <SwitchButton on={on} onChange={(next) => save.mutate(next)} disabled={data === undefined || save.isPending} label={title} testId="section-switch-button" />
      <div className="min-w-0">
        <p className="text-sm font-bold">{title}</p>
        <p className="text-xs text-gray-500">{on ? onText : offText}</p>
      </div>
    </div>
  );
}
