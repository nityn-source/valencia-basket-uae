"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowLeft, ExternalLink, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { IMAGE_LIMITS_TEXT, imageFileProblem } from "@/lib/blogPaste";
import { COVER_HEALTH_KEY, useCoverHealth, type CoverHealth } from "./reelCoverHealth";
import { MAX_HOMEPAGE_REELS, REEL_LIMITS, isPlaceholderReel, REEL_TARGETS, REEL_TARGET_IDS, reelId, type Reel, type ReelTarget } from "@/lib/reels";

interface ReelsResponse {
  reels: Reel[];
}

interface Draft {
  url: string;
  caption: string;
  target: ReelTarget;
  poster: string;
  visible: boolean;
}

type FieldErrors = Partial<Record<keyof Draft, string>>;

const NEW = "new" as const;

function toDraft(reel: Reel | null, target?: ReelTarget): Draft {
  return {
    url: reel?.url ?? "",
    caption: reel?.caption ?? "",
    target: reel?.target ?? target ?? "homepage",
    poster: reel?.poster ?? "",
    visible: reel?.visible ?? true,
  };
}

async function readError(res: Response, fallback: string) {
  const data = await res.json().catch(() => ({}));
  const error = new Error(data?.error || fallback) as Error & { field?: string };
  error.field = data?.field ?? undefined;
  return error;
}

function Counter({ value, max }: { value: string; max: number }) {
  return <p className="mt-1 text-xs text-gray-400">{value.length}/{max} characters</p>;
}

function shortLink(url: string) {
  return url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
}

function Thumb({ poster }: { poster?: string | null }) {
  return poster ? (
    <img src={poster} alt="" className="h-12 w-7 shrink-0 rounded-sm object-cover" />
  ) : (
    <div className="flex h-12 w-7 shrink-0 items-center justify-center rounded-sm bg-neutral-800 text-white"><Play className="h-3 w-3 fill-current" /></div>
  );
}

function ReelEditor({
  reel,
  defaultTarget,
  onSaved,
  onDeleted,
  onBack,
}: {
  reel: Reel | null;
  defaultTarget?: ReelTarget;
  onSaved: (reel: Reel) => void;
  onDeleted: () => void;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [draft, setDraft] = useState<Draft>(() => toDraft(reel, defaultTarget));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [uploading, setUploading] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const isNew = reel === null;

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const save = useMutation({
    mutationFn: async (payload: Draft) => {
      const res = await fetch(isNew ? "/api/admin/reels" : `/api/admin/reels/${reel!.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw await readError(res, "Unable to save");
      return (await res.json()) as Reel;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["admin-reels"] });
      queryClient.invalidateQueries({ queryKey: COVER_HEALTH_KEY });
      const status = (saved as Reel & { coverStatus?: string }).coverStatus;
      toast({
        title: isNew ? "Reel added. Live within a minute." : "Saved. Live within a minute.",
        description: status === "added" ? "Cover picture taken from Instagram automatically." : status === "failed" ? "Couldn't get a cover from Instagram automatically. Upload one by hand." : undefined,
      });
      onSaved(saved);
    },
    onError: (error: Error & { field?: string }) => {
      if (error.field) setErrors({ [error.field]: error.message } as FieldErrors);
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/reels/${reel!.id}`, { method: "DELETE" });
      if (!res.ok) throw await readError(res, "Unable to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reels"] });
      toast({ title: "Reel deleted" });
      onDeleted();
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const submit = () => {
    const found: FieldErrors = {};
    if (!draft.url.trim()) found.url = "Paste the reel's Instagram link";
    else if (!reelId(draft.url.trim())) found.url = "That doesn't look like an Instagram reel link (instagram.com/reel/…)";
    setErrors(found);
    if (Object.keys(found).length) {
      toast({ title: "Please fix the highlighted fields", variant: "destructive" });
      return;
    }
    save.mutate({ ...draft, url: draft.url.trim() });
  };

  const uploadPoster = async (file?: File) => {
    if (!file) return;
    const problem = imageFileProblem(file);
    if (problem) {
      toast({ title: problem, variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/admin/blog/upload-image", { method: "POST", body });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error ?? "Failed to upload image");
      update("poster", result.url as string);
      toast({ title: "Cover image uploaded. Click Save changes to publish it." });
    } catch (error) {
      toast({ title: error instanceof Error ? error.message : "Failed to upload image", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const errorText = (key: keyof Draft) => errors[key] && <p className="mt-1 text-xs text-red-600">{errors[key]}</p>;
  const label = "mb-1.5 mt-4 block text-sm font-semibold";

  return (
    <div data-testid="reel-editor">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
        <span className="font-black uppercase tracking-tight">{isNew ? "New reel" : "Edit reel"}</span>
        <Button type="button" variant="outline" size="sm" className="xl:hidden" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" /> Back to list</Button>
      </div>
      <div className="p-4">
        <label htmlFor="reel-url" className="mb-1.5 block text-sm font-semibold">Instagram reel link *</label>
        <Input id="reel-url" value={draft.url} maxLength={REEL_LIMITS.url} placeholder="https://www.instagram.com/reel/…" onChange={(event) => update("url", event.target.value)} />
        {errorText("url")}
        <p className="mt-1 text-xs text-gray-500">Open the reel on Instagram, tap Share → Copy link, and paste it here.</p>

        <label htmlFor="reel-caption" className={label}>Caption (optional)</label>
        <Input id="reel-caption" value={draft.caption} maxLength={REEL_LIMITS.caption} onChange={(event) => update("caption", event.target.value)} />
        <Counter value={draft.caption} max={REEL_LIMITS.caption} />
        {errorText("caption")}

        <label htmlFor="reel-target" className={label}>Shows on</label>
        <select
          id="reel-target"
          value={draft.target}
          onChange={(event) => update("target", event.target.value as ReelTarget)}
          className="h-9 w-full border border-input bg-transparent px-3 text-sm"
        >
          {REEL_TARGETS.map((target) => <option key={target.id} value={target.id}>{target.label}</option>)}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Program pages only show a reels row once they have at least one reel.{!isNew && " Moving a reel puts it at the end of the new list."}
        </p>

        <label className={label}>Cover image (optional)</label>
        <div className="flex items-center gap-4">
          {draft.poster ? (
            <img src={draft.poster} alt="" className="h-28 w-16 shrink-0 rounded-sm object-cover" />
          ) : (
            <div className="flex h-28 w-16 shrink-0 items-center justify-center rounded-sm bg-neutral-800 text-white"><Play className="h-5 w-5 fill-current" /></div>
          )}
          <div>
            <label className="inline-flex cursor-pointer items-center gap-2 border border-gray-300 px-3 py-2 text-sm font-bold">
              {uploading ? "Uploading…" : draft.poster ? "Replace image" : "Upload image"}
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" disabled={uploading} onChange={(event) => uploadPoster(event.target.files?.[0])} data-testid="reel-poster-input" />
            </label>
            {draft.poster && (
              <button type="button" className="ml-3 text-sm font-semibold text-red-600 hover:underline" onClick={() => update("poster", "")}>Remove</button>
            )}
            <p className="mt-2 text-xs text-gray-500">Shown on the card before the reel loads. <b>Leave it empty and the cover is taken from Instagram automatically when you save.</b> Or upload your own (tall 9:16 images look best). {IMAGE_LIMITS_TEXT}</p>
          </div>
        </div>

        <label className="mt-5 flex items-center gap-2 text-sm font-semibold">
          <Checkbox checked={draft.visible} onCheckedChange={(value) => update("visible", value === true)} data-testid="reel-visible" /> Show on site
        </label>
        <p className="mt-1 text-xs text-gray-500">Turn off to hide a reel without deleting it.</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" onClick={submit} disabled={save.isPending || uploading}>{isNew ? "Add reel" : "Save changes"}</Button>
          {!isNew && (
            <Button type="button" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setConfirmingDelete(true)} disabled={remove.isPending}>Delete</Button>
          )}
          {!isNew && (
            <a href={reel!.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 text-sm font-semibold text-[#FF6C0E] hover:underline">
              Open on Instagram <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {isNew && <Button type="button" variant="ghost" onClick={onBack}>Cancel</Button>}
        </div>

        {confirmingDelete && reel && (
          <div className="mt-4 space-y-3 border border-red-200 bg-red-50 p-4" data-testid="reel-delete-confirm">
            <p className="text-sm font-bold">Delete this reel permanently? To keep it for later, switch off &quot;Show on site&quot; instead.</p>
            <div className="flex gap-2">
              <Button type="button" className="bg-red-600 hover:bg-red-700" onClick={() => remove.mutate()} disabled={remove.isPending}>Yes, delete</Button>
              <Button type="button" variant="ghost" onClick={() => setConfirmingDelete(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CoverHealthBanner({ missing }: { missing: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: health } = useCoverHealth();

  const recheck = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/reels/cover-health?probe=force");
      if (!res.ok) throw new Error("Couldn't check Instagram");
      return (await res.json()) as CoverHealth;
    },
    onSuccess: (next) => {
      queryClient.setQueryData(COVER_HEALTH_KEY, next);
      toast({ title: next.state === "ok" ? "Instagram is answering: automatic covers are working" : "Still not working", variant: next.state === "ok" ? undefined : "destructive" });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const fill = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/reels/covers", { method: "POST" });
      if (!res.ok) throw await readError(res, "Couldn't fetch covers");
      return (await res.json()) as { added: number; failed: number; remaining: number; health: CoverHealth };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-reels"] });
      queryClient.setQueryData(COVER_HEALTH_KEY, result.health);
      toast({
        title: result.added ? `${result.added} cover${result.added === 1 ? "" : "s"} added` : "No covers added",
        description: result.failed ? `${result.failed} couldn't be fetched.` : result.remaining ? `${result.remaining} more without a cover: click again.` : undefined,
        variant: result.added || !result.failed ? undefined : "destructive",
      });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-3" data-testid="reel-cover-status">
      {health?.state === "failing" && (
        <div role="alert" className="border border-red-300 bg-red-50 p-4" data-testid="reel-cover-warning">
          <p className="text-sm font-black uppercase text-red-700">Automatic reel covers have stopped working</p>
          <p className="mt-1 text-sm text-red-800">{health.message}</p>
          <p className="mt-2 text-xs text-red-800">
            Reels already on the site are not affected, and their covers are saved. New reels just won&apos;t get a cover automatically: upload one by hand in the reel&apos;s editor until this is fixed.
            {health.failingSince && <> Failing since {new Date(health.failingSince).toLocaleString()}.</>}
            {health.lastSuccessAt && <> Last worked {new Date(health.lastSuccessAt).toLocaleString()}.</>} Tell your developer: <i>&quot;Instagram reel covers (lib/reelCover.ts) stopped working: {health.reason}&quot;</i>.
          </p>
          <Button type="button" size="sm" variant="outline" className="mt-3 border-red-300" onClick={() => recheck.mutate()} disabled={recheck.isPending} data-testid="button-cover-recheck">
            {recheck.isPending ? "Checking…" : "Check again"}
          </Button>
        </div>
      )}
      {missing > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-gray-200 bg-white px-4 py-3">
          <p className="text-sm text-gray-700">{missing} reel{missing === 1 ? " has" : "s have"} no cover picture.</p>
          <Button type="button" size="sm" onClick={() => fill.mutate()} disabled={fill.isPending} data-testid="button-fetch-covers">
            {fill.isPending ? "Fetching from Instagram…" : "Fetch missing covers"}
          </Button>
        </div>
      )}
    </div>
  );
}

export function ReelsManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState<number | typeof NEW | null>(null);
  const [newTarget, setNewTarget] = useState<ReelTarget>("homepage");
  const [mobileEditing, setMobileEditing] = useState(false);

  const { data, isLoading, isError } = useQuery<ReelsResponse>({
    queryKey: ["admin-reels"],
    queryFn: async () => {
      const res = await fetch("/api/admin/reels");
      if (!res.ok) throw new Error("Failed to load reels");
      return res.json();
    },
  });

  const reorder = useMutation({
    mutationFn: async ({ target, ids }: { target: ReelTarget; ids: number[] }) => {
      const res = await fetch("/api/admin/reels/reorder", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ target, ids }),
      });
      if (!res.ok) throw await readError(res, "Unable to save the order");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reels"] });
      toast({ title: "Order saved" });
    },
    onError: (error: Error) => {
      queryClient.invalidateQueries({ queryKey: ["admin-reels"] });
      toast({ title: error.message, variant: "destructive" });
    },
  });

  if (isLoading) return <div className="py-12 text-center text-gray-500">Loading reels...</div>;
  if (isError || !data) return <div className="py-12 text-center text-red-600">Couldn&apos;t load reels. Refresh to try again.</div>;

  const reels = data.reels;
  const current = typeof selected === "number" ? reels.find((reel) => reel.id === selected) ?? null : null;
  const editorOpen = selected === NEW || current !== null;

  const open = (id: number | typeof NEW, target?: ReelTarget) => {
    if (target) setNewTarget(target);
    setSelected(id);
    setMobileEditing(true);
  };
  const close = () => {
    setSelected(null);
    setMobileEditing(false);
  };

  const move = (reel: Reel, direction: -1 | 1) => {
    const ids = reels.filter((candidate) => candidate.target === reel.target).map((candidate) => candidate.id!);
    const index = ids.indexOf(reel.id!);
    const swap = index + direction;
    if (swap < 0 || swap >= ids.length) return;
    [ids[index], ids[swap]] = [ids[swap], ids[index]];
    // Show the new order right away; the server confirms it.
    queryClient.setQueryData<ReelsResponse>(["admin-reels"], (old) =>
      old && {
        ...old,
        reels: old.reels
          .map((candidate) => (candidate.target === reel.target ? { ...candidate, sortOrder: ids.indexOf(candidate.id!) } : candidate))
          .sort((a, b) => REEL_TARGET_IDS.indexOf(a.target) - REEL_TARGET_IDS.indexOf(b.target) || (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
      },
    );
    reorder.mutate({ target: reel.target, ids });
  };

  return (
    <div className="space-y-6" data-testid="reels-manager">
      <p className="text-sm text-gray-500">
        Add reels by pasting their Instagram link. They appear in the &quot;Follow the action&quot; section on the homepage (the first {MAX_HOMEPAGE_REELS} visible reels) and on program pages. A cover picture is taken from Instagram automatically so each card shows instantly while the reel loads. The section&apos;s heading and button text are under Home → Instagram reels.
      </p>
      <CoverHealthBanner missing={reels.filter((reel) => !reel.poster && !isPlaceholderReel(reel)).length} />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className={`border border-gray-200 bg-white ${mobileEditing ? "hidden xl:block" : ""}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
            <span className="font-black uppercase tracking-tight">Instagram reels</span>
            <Button type="button" onClick={() => open(NEW)} data-testid="button-add-reel"><Plus className="mr-1 h-4 w-4" /> Add reel</Button>
          </div>
          {REEL_TARGETS.map((target) => {
            const inTarget = reels.filter((reel) => reel.target === target.id);
            if (target.id !== "homepage" && inTarget.length === 0) return null;
            return (
              <div key={target.id}>
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">{target.label} · {inTarget.length}</span>
                  <button type="button" className="text-[11px] font-bold uppercase text-primary hover:underline" onClick={() => open(NEW, target.id)}>+ Add here</button>
                </div>
                {inTarget.length === 0 && <p className="border-b border-gray-100 px-4 py-3 text-xs text-gray-500">No reels yet, so this section is hidden on the site.</p>}
                {inTarget.map((reel, index) => (
                  <div
                    key={reel.id}
                    className={`flex items-center gap-3 border-b border-gray-100 px-4 py-2.5 ${selected === reel.id ? "bg-orange-50 shadow-[inset_3px_0_0_#FF6C0E]" : "hover:bg-orange-50/50"}`}
                    data-testid={`reel-row-${reel.id}`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <button type="button" aria-label="Move up" className="flex h-5 w-6 items-center justify-center border border-gray-200 bg-white disabled:opacity-30" disabled={index === 0 || reorder.isPending} onClick={() => move(reel, -1)}><ArrowUp className="h-3 w-3" /></button>
                      <button type="button" aria-label="Move down" className="flex h-5 w-6 items-center justify-center border border-gray-200 bg-white disabled:opacity-30" disabled={index === inTarget.length - 1 || reorder.isPending} onClick={() => move(reel, 1)}><ArrowDown className="h-3 w-3" /></button>
                    </div>
                    <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => open(reel.id!)}>
                      <span className={reel.visible ? "" : "opacity-45"}><Thumb poster={reel.poster} /></span>
                      <span className="min-w-0">
                        <span className={`block truncate text-sm font-bold ${reel.visible ? "" : "text-gray-400"}`}>{reel.caption || "No caption"}</span>
                        <span className="block truncate text-xs text-gray-500">{shortLink(reel.url)}</span>
                      </span>
                      {!reel.visible && <span className="shrink-0 rounded bg-red-100 px-1.5 text-[10px] font-bold uppercase text-red-600">Hidden</span>}
                      {reel.visible && !reel.poster && <span className="shrink-0 rounded bg-amber-100 px-1.5 text-[10px] font-bold uppercase text-amber-700">No cover</span>}
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </section>

        <section className={`border border-gray-200 bg-white ${mobileEditing ? "" : "hidden xl:block"}`}>
          {editorOpen ? (
            <ReelEditor
              key={selected === NEW ? `new-${newTarget}` : `${current!.id}`}
              reel={selected === NEW ? null : current}
              defaultTarget={newTarget}
              onSaved={(saved) => setSelected(saved.id ?? null)}
              onDeleted={close}
              onBack={close}
            />
          ) : (
            <div className="px-4 py-16 text-center text-sm text-gray-500">Select a reel on the left to edit it, or add a new one.</div>
          )}
        </section>
      </div>
    </div>
  );
}
