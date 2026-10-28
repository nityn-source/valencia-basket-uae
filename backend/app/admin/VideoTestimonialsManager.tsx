"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowLeft, ExternalLink, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { IMAGE_LIMITS_TEXT, imageFileProblem } from "@/lib/blogPaste";
import { SectionSwitch } from "./SectionSwitch";
import { MAX_HOMEPAGE_VIDEOS, VIDEO_LIMITS, videoSource, type VideoTestimonial } from "@/lib/videoTestimonials";

interface VideosResponse {
  videos: VideoTestimonial[];
}

interface Draft {
  url: string;
  name: string;
  role: string;
  quote: string;
  poster: string;
  visible: boolean;
}

type FieldErrors = Partial<Record<keyof Draft, string>>;

const NEW = "new" as const;

function toDraft(video: VideoTestimonial | null): Draft {
  return {
    url: video?.url ?? "",
    name: video?.name ?? "",
    role: video?.role ?? "",
    quote: video?.quote ?? "",
    poster: video?.poster ?? "",
    visible: video?.visible ?? true,
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

/** The cover shown on the site: the uploaded image, else the video's own still frame. */
function coverOf(url: string, poster?: string | null) {
  if (poster) return poster;
  return videoSource(url)?.thumbnail ?? null;
}

function Thumb({ url, poster }: { url: string; poster?: string | null }) {
  const src = coverOf(url, poster);
  return src ? (
    <img src={src} alt="" className="h-9 w-16 shrink-0 rounded-sm bg-neutral-800 object-cover" onError={(event) => (event.currentTarget.style.visibility = "hidden")} />
  ) : (
    <div className="flex h-9 w-16 shrink-0 items-center justify-center rounded-sm bg-neutral-800 text-white"><Play className="h-3 w-3 fill-current" /></div>
  );
}

function VideoEditor({
  video,
  onSaved,
  onDeleted,
  onBack,
}: {
  video: VideoTestimonial | null;
  onSaved: (video: VideoTestimonial) => void;
  onDeleted: () => void;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [draft, setDraft] = useState<Draft>(() => toDraft(video));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [uploading, setUploading] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const isNew = video === null;

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const save = useMutation({
    mutationFn: async (payload: Draft) => {
      const res = await fetch(isNew ? "/api/admin/video-testimonials" : `/api/admin/video-testimonials/${video!.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw await readError(res, "Unable to save");
      return (await res.json()) as VideoTestimonial;
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["admin-video-testimonials"] });
      toast({ title: isNew ? "Video added. Live within a minute." : "Saved. Live within a minute." });
      onSaved(saved);
    },
    onError: (error: Error & { field?: string }) => {
      if (error.field) setErrors({ [error.field]: error.message } as FieldErrors);
      toast({ title: error.message, variant: "destructive" });
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/video-testimonials/${video!.id}`, { method: "DELETE" });
      if (!res.ok) throw await readError(res, "Unable to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-video-testimonials"] });
      toast({ title: "Video deleted" });
      onDeleted();
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const submit = () => {
    const found: FieldErrors = {};
    if (!draft.url.trim()) found.url = "Paste the video's YouTube or Google Drive link";
    else if (!videoSource(draft.url)) found.url = "That doesn't look like a YouTube or Google Drive video link";
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
  const cover = coverOf(draft.url, draft.poster);

  return (
    <div data-testid="video-editor">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
        <span className="font-black uppercase tracking-tight">{isNew ? "New video" : "Edit video"}</span>
        <Button type="button" variant="outline" size="sm" className="xl:hidden" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" /> Back to list</Button>
      </div>
      <div className="p-4">
        <label htmlFor="video-url" className="mb-1.5 block text-sm font-semibold">Video link (YouTube or Google Drive) *</label>
        <Input id="video-url" value={draft.url} maxLength={VIDEO_LIMITS.url} placeholder="https://youtu.be/…" onChange={(event) => update("url", event.target.value)} />
        {errorText("url")}
        <p className="mt-1 text-xs text-gray-500">
          <b>YouTube (recommended):</b> upload the video in YouTube Studio, set visibility to <b>Unlisted</b>, then paste its link (Share → Copy). Unlisted videos don&apos;t appear in YouTube search or on the channel, but play on the site.
          <br />
          <b>Google Drive:</b> right-click the video → Share → General access → <b>Anyone with the link</b> (Viewer), then paste the link. Otherwise visitors will see &quot;you need access&quot;.
        </p>

        <label htmlFor="video-name" className={label}>Name (optional)</label>
        <Input id="video-name" value={draft.name} maxLength={VIDEO_LIMITS.name} placeholder="Sarah M." onChange={(event) => update("name", event.target.value)} />
        {errorText("name")}

        <label htmlFor="video-role" className={label}>Who they are</label>
        <Input id="video-role" value={draft.role} maxLength={VIDEO_LIMITS.role} placeholder="Parent of U12 player" onChange={(event) => update("role", event.target.value)} />

        <label htmlFor="video-quote" className={label}>One-line quote (optional)</label>
        <Input id="video-quote" value={draft.quote} maxLength={VIDEO_LIMITS.quote} placeholder="My son's confidence has changed." onChange={(event) => update("quote", event.target.value)} />
        <Counter value={draft.quote} max={VIDEO_LIMITS.quote} />

        <label className={label}>Cover image (optional)</label>
        <div className="flex items-center gap-4">
          {cover ? (
            <img src={cover} alt="" className="h-20 w-36 shrink-0 rounded-sm bg-neutral-800 object-cover" onError={(event) => (event.currentTarget.style.visibility = "hidden")} />
          ) : (
            <div className="flex h-20 w-36 shrink-0 items-center justify-center rounded-sm bg-neutral-800 text-white"><Play className="h-5 w-5 fill-current" /></div>
          )}
          <div>
            <label className="inline-flex cursor-pointer items-center gap-2 border border-gray-300 px-3 py-2 text-sm font-bold">
              {uploading ? "Uploading…" : draft.poster ? "Replace image" : "Upload image"}
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" disabled={uploading} onChange={(event) => uploadPoster(event.target.files?.[0])} data-testid="video-poster-input" />
            </label>
            {draft.poster && <button type="button" className="ml-3 text-sm font-semibold text-red-600 hover:underline" onClick={() => update("poster", "")}>Remove</button>}
            <p className="mt-2 text-xs text-gray-500">
              Shown before the video is played. Without one, the video&apos;s own frame from YouTube or Drive is used. Wide (16:9) images look best. {IMAGE_LIMITS_TEXT}
            </p>
          </div>
        </div>

        <label className="mt-5 flex items-center gap-2 text-sm font-semibold">
          <Checkbox checked={draft.visible} onCheckedChange={(value) => update("visible", value === true)} data-testid="video-visible" /> Show on site
        </label>
        <p className="mt-1 text-xs text-gray-500">Turn off to hide a video without deleting it.</p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" onClick={submit} disabled={save.isPending || uploading}>{isNew ? "Add video" : "Save changes"}</Button>
          {!isNew && (
            <Button type="button" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setConfirmingDelete(true)} disabled={remove.isPending}>Delete</Button>
          )}
          {!isNew && videoSource(video!.url) && (
            <a href={videoSource(video!.url)!.watchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 text-sm font-semibold text-[#FF6C0E] hover:underline">
              Open in Drive <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {isNew && <Button type="button" variant="ghost" onClick={onBack}>Cancel</Button>}
        </div>

        {confirmingDelete && video && (
          <div className="mt-4 space-y-3 border border-red-200 bg-red-50 p-4" data-testid="video-delete-confirm">
            <p className="text-sm font-bold">Delete this video from the website? The video on YouTube or Drive is not touched. To keep it for later, switch off &quot;Show on site&quot; instead.</p>
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

export function VideoTestimonialsManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selected, setSelected] = useState<number | typeof NEW | null>(null);
  const [mobileEditing, setMobileEditing] = useState(false);

  const { data, isLoading, isError } = useQuery<VideosResponse>({
    queryKey: ["admin-video-testimonials"],
    queryFn: async () => {
      const res = await fetch("/api/admin/video-testimonials");
      if (!res.ok) throw new Error("Failed to load videos");
      return res.json();
    },
  });

  const reorder = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await fetch("/api/admin/video-testimonials/reorder", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw await readError(res, "Unable to save the order");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-video-testimonials"] });
      toast({ title: "Order saved" });
    },
    onError: (error: Error) => {
      queryClient.invalidateQueries({ queryKey: ["admin-video-testimonials"] });
      toast({ title: error.message, variant: "destructive" });
    },
  });

  if (isLoading) return <div className="py-12 text-center text-gray-500">Loading videos...</div>;
  if (isError || !data) return <div className="py-12 text-center text-red-600">Couldn&apos;t load videos. Refresh to try again.</div>;

  const videos = data.videos;
  const current = typeof selected === "number" ? videos.find((video) => video.id === selected) ?? null : null;
  const editorOpen = selected === NEW || current !== null;
  const shown = videos.filter((video) => video.visible).length;

  const open = (id: number | typeof NEW) => {
    setSelected(id);
    setMobileEditing(true);
  };
  const close = () => {
    setSelected(null);
    setMobileEditing(false);
  };

  const move = (video: VideoTestimonial, direction: -1 | 1) => {
    const ids = videos.map((candidate) => candidate.id!);
    const index = ids.indexOf(video.id!);
    const swap = index + direction;
    if (swap < 0 || swap >= ids.length) return;
    [ids[index], ids[swap]] = [ids[swap], ids[index]];
    queryClient.setQueryData<VideosResponse>(["admin-video-testimonials"], (old) =>
      old && { ...old, videos: ids.map((id, order) => ({ ...old.videos.find((candidate) => candidate.id === id)!, sortOrder: order })) },
    );
    reorder.mutate(ids);
  };

  return (
    <div className="space-y-6" data-testid="video-testimonials-manager">
      <p className="text-sm text-gray-500">
        Parent and player videos for the &quot;Community Stories&quot; block on the homepage. Upload each video to YouTube as Unlisted (or share it from Google Drive with &quot;Anyone with the link&quot;) and paste its link here. The homepage shows the first {MAX_HOMEPAGE_VIDEOS} visible videos. The block&apos;s heading, text and button are under Home → Community stories (videos). If there are no visible videos, the whole block is hidden.
      </p>
      <SectionSwitch
        contentKey="home.testimonials.show"
        title="Show the Community Stories videos on the homepage"
        onText={`On: the homepage shows the first ${MAX_HOMEPAGE_VIDEOS} visible videos below.`}
        offText="Off: the whole video block is hidden from the homepage. Your videos stay saved here."
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className={`border border-gray-200 bg-white ${mobileEditing ? "hidden xl:block" : ""}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 py-3">
            <span className="font-black uppercase tracking-tight">Video testimonials · {shown} shown</span>
            <Button type="button" onClick={() => open(NEW)} data-testid="button-add-video"><Plus className="mr-1 h-4 w-4" /> Add video</Button>
          </div>
          {videos.length === 0 && <p className="border-b border-gray-100 px-4 py-6 text-center text-xs text-gray-500">No videos yet, so the videos row is hidden on the site.</p>}
          {videos.map((video, index) => (
            <div
              key={video.id}
              className={`flex items-center gap-3 border-b border-gray-100 px-4 py-2.5 ${selected === video.id ? "bg-orange-50 shadow-[inset_3px_0_0_#FF6C0E]" : "hover:bg-orange-50/50"}`}
              data-testid={`video-row-${video.id}`}
            >
              <div className="flex flex-col gap-0.5">
                <button type="button" aria-label="Move up" className="flex h-5 w-6 items-center justify-center border border-gray-200 bg-white disabled:opacity-30" disabled={index === 0 || reorder.isPending} onClick={() => move(video, -1)}><ArrowUp className="h-3 w-3" /></button>
                <button type="button" aria-label="Move down" className="flex h-5 w-6 items-center justify-center border border-gray-200 bg-white disabled:opacity-30" disabled={index === videos.length - 1 || reorder.isPending} onClick={() => move(video, 1)}><ArrowDown className="h-3 w-3" /></button>
              </div>
              <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => open(video.id!)}>
                <span className={video.visible ? "" : "opacity-45"}><Thumb url={video.url} poster={video.poster} /></span>
                <span className="min-w-0">
                  <span className={`block truncate text-sm font-bold ${video.visible ? "" : "text-gray-400"}`}>{video.name || "No name"}</span>
                  <span className="block truncate text-xs text-gray-500">{video.role || "No role"}</span>
                </span>
                {!video.visible && <span className="shrink-0 rounded bg-red-100 px-1.5 text-[10px] font-bold uppercase text-red-600">Hidden</span>}
                {video.visible && index >= MAX_HOMEPAGE_VIDEOS && <span className="shrink-0 rounded bg-gray-100 px-1.5 text-[10px] font-bold uppercase text-gray-500">Not shown (over {MAX_HOMEPAGE_VIDEOS})</span>}
              </button>
            </div>
          ))}
        </section>

        <section className={`border border-gray-200 bg-white ${mobileEditing ? "" : "hidden xl:block"}`}>
          {editorOpen ? (
            <VideoEditor
              key={selected === NEW ? "new" : `${current!.id}`}
              video={selected === NEW ? null : current}
              onSaved={(saved) => setSelected(saved.id ?? null)}
              onDeleted={close}
              onBack={close}
            />
          ) : (
            <div className="px-4 py-16 text-center text-sm text-gray-500">Select a video on the left to edit it, or add a new one.</div>
          )}
        </section>
      </div>
    </div>
  );
}
