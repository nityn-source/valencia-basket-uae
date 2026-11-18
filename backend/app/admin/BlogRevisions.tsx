"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { blogRevisionPreviewPath } from "@/lib/blogPreview";
import { revisionReasonLabel } from "@/lib/blogRevisions";
import type { ArticleDiff, BlockDiff, DiffPart } from "@/lib/blogDiff";
import type { BlogRevisionSummary, SafeBlogPost } from "@/lib/storage";

type RevisionRow = Omit<BlogRevisionSummary, "createdAt"> & { createdAt: string };
type ListResponse = { revisions: RevisionRow[]; currentRevisionId: number | null };
type DetailResponse = {
  revision: RevisionRow;
  current: { title: string; wordCount: number };
  diff: {
    title: DiffPart[];
    excerpt: DiffPart[];
    metaTitle: DiffPart[];
    metaDescription: DiffPart[];
    featuredImageChanged: boolean;
    article: ArticleDiff;
  };
};

const listKey = (postId: number) => ["admin-blog-revisions", postId] as const;

/** "Today, 2:10 PM", "Yesterday, 9:05 AM", or "15 Nov, 4:12 PM". */
function formatWhen(value: string) {
  const date = new Date(value);
  const time = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const today = new Date();
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(date, today)) return `Today, ${time}`;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(date, yesterday)) return `Yesterday, ${time}`;
  const day = date.toLocaleDateString([], { day: "numeric", month: "short", ...(date.getFullYear() !== today.getFullYear() ? { year: "numeric" as const } : {}) });
  return `${day}, ${time}`;
}

function Parts({ parts }: { parts: DiffPart[] }) {
  return (
    <>
      {parts.map((part, index) =>
        part.type === "add" ? <ins key={index} className="rounded-sm bg-green-100 px-0.5 text-green-800 no-underline">{part.text}</ins>
        : part.type === "del" ? <del key={index} className="rounded-sm bg-red-100 px-0.5 text-red-800">{part.text}</del>
        : <span key={index}>{part.text}</span>,
      )}
    </>
  );
}

const hasChange = (parts: DiffPart[]) => parts.some((part) => part.type !== "same");

function Block({ block }: { block: BlockDiff }) {
  const heading = /^h[1-6]$/.test(block.tag);
  const className = heading ? "mt-3 mb-1 font-extrabold text-gray-900" : block.tag === "li" ? "ml-5 list-disc" : "mb-2";
  if (block.kind === "changed") return <p className={className}><Parts parts={block.parts} /></p>;
  if (block.kind === "added") return <p className={className}><Parts parts={[{ type: "add", text: block.text }]} /></p>;
  if (block.kind === "removed") return <p className={className}><Parts parts={[{ type: "del", text: block.text }]} /></p>;
  return <p className={className}>{block.text}</p>;
}

/** The article's changes with long unchanged stretches folded away. */
function Changes({ diff }: { diff: ArticleDiff }) {
  if (!diff.comparable) return <p className="text-sm italic text-gray-500">This article is too long to compare paragraph by paragraph. Use Preview to read it.</p>;
  const out: React.ReactNode[] = [];
  const blocks = diff.blocks;
  let index = 0;
  while (index < blocks.length) {
    if (blocks[index].kind !== "same") { out.push(<Block key={index} block={blocks[index]} />); index++; continue; }
    let end = index;
    while (end < blocks.length && blocks[end].kind === "same") end++;
    const run = blocks.slice(index, end);
    const first = index === 0;
    const last = end === blocks.length;
    const keepStart = first ? 0 : 1;
    const keepEnd = last ? 0 : 1;
    if (run.length <= keepStart + keepEnd + 1) run.forEach((block, n) => out.push(<Block key={index + n} block={block} />));
    else {
      run.slice(0, keepStart).forEach((block, n) => out.push(<Block key={index + n} block={block} />));
      const hidden = run.length - keepStart - keepEnd;
      out.push(<p key={`gap-${index}`} className="mb-2 text-xs italic text-gray-400">… {hidden} unchanged paragraph{hidden === 1 ? "" : "s"}</p>);
      run.slice(run.length - keepEnd).forEach((block, n) => out.push(<Block key={end - keepEnd + n} block={block} />));
    }
    index = end;
  }
  if (!out.length) return <p className="text-sm italic text-gray-500">The article text is the same as today's.</p>;
  return <>{out}</>;
}

function Detail({ post, row, current, dirty, onRestored, onClose }: { post: SafeBlogPost; row: RevisionRow; current: boolean; dirty: boolean; onRestored: (post: SafeBlogPost) => void; onClose: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  useEffect(() => setConfirming(false), [row.id]);

  const detail = useQuery<DetailResponse>({
    queryKey: ["admin-blog-revision", post.id, row.id],
    enabled: !current,
    queryFn: async () => {
      const response = await fetch(`/api/admin/blog/${post.id}/revisions/${row.id}`);
      if (!response.ok) throw new Error("Couldn't load that version");
      return response.json();
    },
  });

  const restore = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/blog/${post.id}/revisions/${row.id}/restore`, { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Couldn't restore that version");
      return body as SafeBlogPost;
    },
    onSuccess: (restored) => {
      queryClient.invalidateQueries({ queryKey: listKey(post.id) });
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      toast({ title: `Restored the ${formatWhen(row.createdAt)} version`, description: "The version you replaced is still in the list." });
      onRestored(restored);
      onClose();
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  if (current) {
    return (
      <div className="p-5">
        <h3 className="text-lg font-extrabold">Current version</h3>
        <p className="mb-3 mt-1 text-sm text-gray-500">{formatWhen(row.createdAt)}{row.savedBy ? ` by ${row.savedBy}` : ""} · {row.wordCount.toLocaleString()} words. This is what is on the site now.</p>
        <p className="text-sm italic text-gray-500">Pick an earlier version on the left to compare it with this one.</p>
      </div>
    );
  }

  const data = detail.data;
  const delta = data ? data.revision.wordCount - data.current.wordCount : 0;
  return (
    <div className="min-w-0 p-5">
      <h3 className="text-lg font-extrabold">{formatWhen(row.createdAt)}</h3>
      <p className="mb-3 mt-1 text-sm text-gray-500">
        {row.savedBy ? `Saved by ${row.savedBy}` : "Saved before version history began"} · {row.wordCount.toLocaleString()} words
        {data ? ` (${delta === 0 ? "same length as today's" : `${delta > 0 ? "+" : "−"}${Math.abs(delta).toLocaleString()} compared with today's`})` : ""}
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setConfirming(true)} disabled={restore.isPending} data-testid="button-revision-restore">Restore this version</Button>
        <Button asChild size="sm" variant="outline">
          <a href={blogRevisionPreviewPath(post.id, row.id)} target="_blank" rel="noopener noreferrer" data-testid="link-revision-preview">Preview in a new tab</a>
        </Button>
      </div>

      {confirming && (
        <div className="mb-4 border-2 border-black bg-white p-4" role="alertdialog" aria-label="Restore this version" data-testid="revision-confirm">
          <h4 className="text-sm font-black uppercase">Restore the {formatWhen(row.createdAt)} version?</h4>
          <p className="mt-2 text-sm text-gray-700">The title, excerpt, article text, featured image and SEO title and description go back to how they were then. The web address, publish status and date, visibility, categories, tags and author stay as they are.</p>
          <p className="mt-2 text-sm text-gray-700">Today's version stays in this list, so you can undo this by restoring it.</p>
          {dirty && <p className="mt-2 text-sm font-semibold text-red-700">You have unsaved changes in the editor. Restoring replaces them.</p>}
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={() => restore.mutate()} disabled={restore.isPending} data-testid="button-revision-restore-confirm">{restore.isPending ? "Restoring…" : "Restore this version"}</Button>
            <Button size="sm" variant="outline" onClick={() => setConfirming(false)} disabled={restore.isPending}>Cancel</Button>
          </div>
        </div>
      )}

      {detail.isLoading && <p className="text-sm text-gray-500">Loading comparison…</p>}
      {detail.isError && <p className="text-sm text-red-600">Couldn't load that version. Close this window and try again.</p>}
      {data && (
        <>
          <div className="mb-2 flex flex-wrap gap-4 text-xs text-gray-500">
            <span><ins className="rounded-sm bg-green-100 px-1.5 text-green-800 no-underline">green</ins> in this version, not in today's</span>
            <span><del className="rounded-sm bg-red-100 px-1.5 text-red-800">red</del> in today's, not in this version</span>
          </div>
          <div className="border border-gray-200 bg-white p-4 text-[15px] leading-7 text-gray-700" data-testid="revision-compare">
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-gray-400">This version compared with the current one</p>
            <h4 className="mb-2 text-xl font-extrabold leading-snug text-gray-900"><Parts parts={data.diff.title} /></h4>
            <Changes diff={data.diff.article} />
            {(hasChange(data.diff.excerpt) || hasChange(data.diff.metaTitle) || hasChange(data.diff.metaDescription) || data.diff.featuredImageChanged) && (
              <div className="mt-3 space-y-1 border-t pt-3 text-sm">
                {hasChange(data.diff.excerpt) && <p><strong>Excerpt:</strong> <Parts parts={data.diff.excerpt} /></p>}
                {hasChange(data.diff.metaTitle) && <p><strong>SEO title:</strong> <Parts parts={data.diff.metaTitle} /></p>}
                {hasChange(data.diff.metaDescription) && <p><strong>SEO description:</strong> <Parts parts={data.diff.metaDescription} /></p>}
                {data.diff.featuredImageChanged && <p><strong>Featured image:</strong> differs from today's (use Preview to see it).</p>}
              </div>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-400">Compared by text. Images and formatting changes aren't shown here; Preview shows the whole version.</p>
        </>
      )}
    </div>
  );
}

/** Version history for one saved article: a short list in the sidebar and a browser that opens from it. */
export function BlogRevisions({ post, dirty, onRestored }: { post: SafeBlogPost; dirty: boolean; onRestored: (post: SafeBlogPost) => void }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  const list = useQuery<ListResponse>({
    queryKey: listKey(post.id),
    queryFn: async () => {
      const response = await fetch(`/api/admin/blog/${post.id}/revisions`);
      if (!response.ok) throw new Error("Version history isn't available right now");
      return response.json();
    },
  });

  const revisions = list.data?.revisions ?? [];
  const currentId = list.data?.currentRevisionId ?? null;
  const chosen = revisions.find((revision) => revision.id === selected) ?? revisions.find((revision) => revision.id !== currentId) ?? revisions[0];

  return (
    <div className="text-sm" data-testid="blog-revisions">
      {list.isLoading && <p className="text-gray-500">Loading versions…</p>}
      {list.isError && <p className="text-red-600">Version history isn't available right now.</p>}
      {list.data && revisions.length === 0 && <p className="text-gray-600">No earlier versions yet. A version is kept each time you save this article.</p>}
      {revisions.length > 0 && (
        <>
          <p className="mb-2 text-gray-600">{revisions.length} saved version{revisions.length === 1 ? "" : "s"}.</p>
          <ul className="border-t">
            {revisions.slice(0, 3).map((revision) => (
              <li key={revision.id} className="flex justify-between gap-3 border-b py-2 text-[13px]">
                <span><strong>{formatWhen(revision.createdAt)}</strong><br /><span className="text-gray-500">{revision.savedBy ?? "Before history began"}</span></span>
                <span className="whitespace-nowrap text-gray-500">{revision.wordCount.toLocaleString()} words</span>
              </li>
            ))}
          </ul>
          <Button className="mt-3" size="sm" variant="outline" onClick={() => { setSelected(null); setOpen(true); }} data-testid="button-browse-revisions">Browse all versions</Button>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-6xl gap-0 overflow-hidden p-0" data-testid="revisions-dialog">
          <DialogHeader className="border-b px-5 py-4 text-left">
            <DialogTitle className="pr-8 text-base font-black uppercase tracking-wide">Revisions: {post.title}</DialogTitle>
            <DialogDescription className="sr-only">Earlier saved versions of this article, with changes compared against the current version.</DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[calc(90vh-5rem)] min-h-[420px] grid-cols-1 overflow-hidden md:grid-cols-[320px_minmax(0,1fr)]">
            <div className="max-h-[260px] overflow-y-auto border-b bg-stone-50 md:max-h-none md:border-b-0 md:border-r" role="listbox" aria-label="Saved versions">
              {revisions.map((revision, index) => {
                const older = revisions[index + 1];
                const delta = older ? revision.wordCount - older.wordCount : null;
                const isCurrent = revision.id === currentId;
                const label = revisionReasonLabel(revision.reason);
                return (
                  <button
                    key={revision.id}
                    type="button"
                    role="option"
                    aria-selected={chosen?.id === revision.id}
                    onClick={() => setSelected(revision.id)}
                    data-testid={`revision-row-${revision.id}`}
                    className={`block w-full border-b border-l-4 px-4 py-3 text-left hover:bg-white ${chosen?.id === revision.id ? "border-l-primary bg-white" : "border-l-transparent"}`}
                  >
                    <span className="flex items-center justify-between gap-2 text-sm font-bold">
                      {formatWhen(revision.createdAt)}
                      {isCurrent && <span className="bg-black px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">Current</span>}
                    </span>
                    <span className="mt-0.5 block text-xs text-gray-500">{revision.savedBy ?? "Before history began"}{label ? ` · ${label}` : ""}</span>
                    {delta !== null && delta !== 0 && (
                      <span className={`mt-1 block text-xs font-bold ${delta > 0 ? "text-green-700" : "text-red-700"}`}>{delta > 0 ? "+" : "−"}{Math.abs(delta).toLocaleString()} words vs the version before</span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="min-w-0 overflow-y-auto">
              {chosen && <Detail post={post} row={chosen} current={chosen.id === currentId} dirty={dirty} onRestored={onRestored} onClose={() => setOpen(false)} />}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
