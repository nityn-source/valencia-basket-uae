"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAGE_SEO_DEFAULTS } from "@/lib/seo/registry";
import type { SafeBlogPost } from "@/lib/storage";

export const LINK_URL_PATTERN = /^(?:https?:\/\/|mailto:|\/|#)/i;

export type LinkSettings = {
  href: string;
  title: string;
  newTab: boolean;
  nofollow: boolean;
  sponsored: boolean;
};

export const EMPTY_LINK: LinkSettings = { href: "", title: "", newTab: false, nofollow: false, sponsored: false };

/** Reads a link's settings back from the <a> element in the article. */
export function readLinkSettings(link: HTMLAnchorElement): LinkSettings {
  const rel = (link.getAttribute("rel") ?? "").toLowerCase().split(/\s+/);
  return {
    href: link.getAttribute("href") ?? "",
    title: link.getAttribute("title") ?? "",
    newTab: link.getAttribute("target") === "_blank",
    nofollow: rel.includes("nofollow"),
    sponsored: rel.includes("sponsored"),
  };
}

/** Writes settings onto an <a>: target/rel only when needed, so a plain followed link stays plain. */
export function applyLinkSettings(link: HTMLAnchorElement, settings: LinkSettings) {
  link.setAttribute("href", settings.href.trim());
  if (settings.title.trim()) link.setAttribute("title", settings.title.trim());
  else link.removeAttribute("title");
  if (settings.newTab) link.setAttribute("target", "_blank");
  else link.removeAttribute("target");
  const rel = [
    settings.nofollow && "nofollow",
    settings.sponsored && "sponsored",
    settings.newTab && "noopener noreferrer",
  ].filter(Boolean).join(" ");
  if (rel) link.setAttribute("rel", rel);
  else link.removeAttribute("rel");
}

type ContentItem = { label: string; href: string; kind: string };

/** Site pages plus published articles, for "Or link to existing content". */
function useLinkableContent() {
  const posts = useQuery<SafeBlogPost[]>({
    queryKey: ["admin-blog"],
    queryFn: async () => {
      const response = await fetch("/api/admin/blog");
      if (!response.ok) throw new Error("Failed to load blog posts");
      return response.json();
    },
  });
  return useMemo<ContentItem[]>(() => [
    ...(posts.data ?? [])
      .filter((post) => post.status === "published" && post.visibility === "public")
      .map((post) => ({
        label: post.title,
        href: `/blog/${post.slug}`,
        kind: post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-CA").replace(/-/g, "/") : "ARTICLE",
      })),
    ...PAGE_SEO_DEFAULTS.filter((page) => !page.noIndex).map((page) => ({ label: page.label, href: page.path, kind: "PAGE" })),
  ], [posts.data]);
}

/** WordPress-style "Insert/edit link" window. */
export function BlogLinkDialog({ open, initial, isNew, onCancel, onSubmit }: {
  open: boolean;
  initial: LinkSettings;
  isNew: boolean;
  onCancel: () => void;
  onSubmit: (settings: LinkSettings) => void;
}) {
  const [settings, setSettings] = useState<LinkSettings>(initial);
  const [search, setSearch] = useState("");
  const content = useLinkableContent();

  useEffect(() => {
    if (open) {
      setSettings(initial);
      setSearch("");
    }
  }, [open, initial]);

  const term = search.trim().toLowerCase();
  const results = (term ? content.filter((item) => `${item.label} ${item.href}`.toLowerCase().includes(term)) : content).slice(0, 30);
  const valid = LINK_URL_PATTERN.test(settings.href.trim());
  const update = <K extends keyof LinkSettings>(field: K, value: LinkSettings[K]) => setSettings((current) => ({ ...current, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-w-xl" data-testid="link-dialog" onCloseAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{isNew ? "Insert link" : "Edit link"}</DialogTitle>
          <DialogDescription>Enter the destination URL</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (valid) onSubmit({ ...settings, href: settings.href.trim(), title: settings.title.trim() });
          }}
        >
          <div className="grid grid-cols-[5.5rem_1fr] items-center gap-x-3 gap-y-3">
            <Label htmlFor="link-url" className="text-right">URL</Label>
            <Input id="link-url" autoFocus value={settings.href} onChange={(event) => update("href", event.target.value)} placeholder="https://…  or  /programs" aria-invalid={!!settings.href && !valid} className="aria-[invalid=true]:border-red-500" data-testid="input-link-url" />
            <Label htmlFor="link-title" className="text-right">Link Title</Label>
            <Input id="link-title" value={settings.title} onChange={(event) => update("title", event.target.value)} placeholder="Optional — shown when hovering the link" data-testid="input-link-title" />
            <div />
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2"><Checkbox checked={settings.newTab} onCheckedChange={(value) => update("newTab", value === true)} data-testid="checkbox-link-new-tab" /> Open link in a new tab</label>
              <label className="flex items-center gap-2"><Checkbox checked={settings.nofollow} onCheckedChange={(value) => update("nofollow", value === true)} data-testid="checkbox-link-nofollow" /> Add <code className="text-xs">rel="nofollow"</code></label>
              <label className="flex items-center gap-2"><Checkbox checked={settings.sponsored} onCheckedChange={(value) => update("sponsored", value === true)} data-testid="checkbox-link-sponsored" /> Add <code className="text-xs">rel="sponsored"</code></label>
            </div>
          </div>
          {settings.href && !valid && <p className="text-xs text-red-600">Start the URL with https://, http://, mailto:, / (a page on this site) or #.</p>}

          <div className="border-t pt-4">
            <p className="mb-2 text-sm font-semibold text-gray-700">Or link to existing content</p>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search pages and articles" aria-label="Search pages and articles" data-testid="input-link-search" />
            <div className="mt-2 max-h-56 overflow-y-auto border">
              <p className="border-l-4 border-blue-500 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                {term ? `${results.length} result${results.length === 1 ? "" : "s"}` : "No search term specified. Showing recent items."}
              </p>
              {results.map((item) => (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => setSettings((current) => ({ ...current, href: item.href }))}
                  className={`flex w-full items-start justify-between gap-4 border-t px-3 py-2 text-left text-sm hover:bg-blue-50 ${settings.href === item.href ? "bg-blue-100" : ""}`}
                >
                  <span>{item.label}<span className="block text-xs text-gray-500">{item.href}</span></span>
                  <span className="shrink-0 text-xs text-gray-500">{item.kind}</span>
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={!valid} data-testid="button-link-submit">{isNew ? "Add Link" : "Update"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
