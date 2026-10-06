"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { BlogEditor } from "./BlogEditor";
import { BlogAuthorSelect } from "./BlogAuthorSelect";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { SafeBlogPost } from "@/lib/storage";

type QuickEdit = { post: SafeBlogPost; authorName?: string; categoryNames?: string[] };

/** Categories picker for one row: tick or untick; at least one category always stays. */
function CategoryDropdown({ post, allCategories, disabled, onChange }: {
  post: SafeBlogPost;
  allCategories: string[];
  disabled: boolean;
  onChange: (categoryNames: string[]) => void;
}) {
  const current = post.categories.map((category) => category.name);
  const options = [...new Set([...allCategories, ...current])];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button type="button" className="flex max-w-[16rem] items-center gap-1 rounded border border-transparent px-2 py-1 text-left hover:border-gray-300 hover:bg-white disabled:opacity-50" data-testid={`select-categories-${post.id}`}>
          <span className="truncate">{current.join(", ") || "—"}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
        <DropdownMenuLabel className="text-xs text-gray-500">Categories</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((name) => {
          const checked = current.includes(name);
          const onlyOne = checked && current.length === 1;
          return (
            <DropdownMenuCheckboxItem
              key={name}
              checked={checked}
              disabled={onlyOne}
              title={onlyOne ? "An article needs at least one category" : undefined}
              onSelect={(event) => event.preventDefault()}
              onCheckedChange={(next) => onChange(next ? [...current, name] : current.filter((value) => value !== name))}
            >
              {name}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function statusLabel(status: string) {
  return status === "published" ? "Published" : status === "scheduled" ? "Scheduled" : "Draft";
}

export function BlogManager({ adminName }: { adminName: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<SafeBlogPost | null>(null);

  const postsQuery = useQuery<SafeBlogPost[]>({
    queryKey: ["admin-blog"],
    queryFn: async () => {
      const response = await fetch("/api/admin/blog");
      if (!response.ok) throw new Error("Failed to load blog posts");
      return response.json();
    },
  });

  const categoriesQuery = useQuery<{ categories: { name: string }[] }>({
    queryKey: ["admin-blog-meta"],
    queryFn: async () => {
      const response = await fetch("/api/admin/blog/meta");
      if (!response.ok) throw new Error("Failed to load categories and tags");
      return response.json();
    },
  });
  const allCategories = (categoriesQuery.data?.categories ?? []).map((category) => category.name).sort((a, b) => a.localeCompare(b));

  // Author and categories save straight from the list, without opening the article.
  const quickEditMutation = useMutation({
    mutationFn: async ({ post, ...changes }: QuickEdit) => {
      const response = await fetch(`/api/admin/blog/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error ?? "Unable to update the article");
      return body as SafeBlogPost;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<SafeBlogPost[]>(["admin-blog"], (posts) => posts?.map((post) => (post.id === updated.id ? updated : post)));
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      queryClient.invalidateQueries({ queryKey: ["admin-blog-meta"] });
      toast({ title: `Saved “${updated.title}”` });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });
  const savingId = quickEditMutation.isPending ? quickEditMutation.variables?.post.id : undefined;

  const deleteMutation = useMutation({
    mutationFn: async (post: SafeBlogPost) => {
      const response = await fetch(`/api/admin/blog/${post.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Unable to move article to trash");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog"] });
      setEditorOpen(false);
      setEditingPost(null);
      toast({ title: "Article moved to trash" });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  if (editorOpen) {
    return (
      <BlogEditor
        key={editingPost?.id ?? "new"}
        post={editingPost}
        adminName={adminName}
        onClose={() => { setEditorOpen(false); setEditingPost(null); }}
        onSaved={(saved) => setEditingPost(saved)}
        onDelete={editingPost ? () => deleteMutation.mutate(editingPost) : undefined}
      />
    );
  }

  const posts = postsQuery.data ?? [];
  return (
    <div className="space-y-6" data-testid="blog-manager">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-tight" data-testid="text-blog-heading">Blog content</h2>
          <p className="mt-1 text-sm text-gray-500">Create, edit, schedule, and publish academy articles.</p>
        </div>
        <Button onClick={() => { setEditingPost(null); setEditorOpen(true); }} data-testid="button-create-blog-post"><Plus className="mr-2 h-4 w-4" /> New article</Button>
      </div>

      {postsQuery.isLoading ? (
        <div className="py-12 text-center text-gray-500">Loading blog posts...</div>
      ) : postsQuery.isError ? (
        <div className="py-12 text-center text-red-600">Unable to load blog posts. Refresh and try again.</div>
      ) : posts.length === 0 ? (
        <Card><CardContent className="py-14 text-center"><h3 className="text-xl font-bold uppercase">No articles yet</h3><p className="mt-2 text-gray-500">Create the first approved article without adding placeholder content.</p><Button className="mt-5" onClick={() => { setEditingPost(null); setEditorOpen(true); }}>Create article</Button></CardContent></Card>
      ) : (
        <div className="overflow-hidden border border-gray-200">
          <Table>
            <TableHeader className="bg-gray-100"><TableRow><TableHead>Title</TableHead><TableHead>Status</TableHead><TableHead>Visibility</TableHead><TableHead>Categories</TableHead><TableHead>Author</TableHead><TableHead>Updated</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id} data-testid={`row-blog-post-${post.id}`}>
                  <TableCell><div className="font-semibold">{post.title}</div><div className="text-xs text-gray-500">/blog/{post.slug}</div></TableCell>
                  <TableCell><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${post.status === "published" ? "bg-green-100 text-green-800" : post.status === "scheduled" ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-700"}`}>{statusLabel(post.status)}</span></TableCell>
                  <TableCell className="capitalize">{post.visibility === "password" ? "Password protected" : post.visibility}</TableCell>
                  <TableCell>
                    <CategoryDropdown post={post} allCategories={allCategories} disabled={savingId === post.id} onChange={(categoryNames) => quickEditMutation.mutate({ post, categoryNames })} />
                  </TableCell>
                  <TableCell>
                    <BlogAuthorSelect
                      value={post.authorName}
                      onChange={(authorName) => authorName !== post.authorName && quickEditMutation.mutate({ post, authorName })}
                      disabled={savingId === post.id}
                      aria-label={`Author of ${post.title}`}
                      data-testid={`select-author-${post.id}`}
                      className="h-8 max-w-[14rem] rounded border border-gray-200 bg-white px-2 text-sm hover:border-gray-400 disabled:opacity-50"
                    />
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{new Date(post.updatedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="ghost" onClick={() => { setEditingPost(post); setEditorOpen(true); }} data-testid={`button-edit-blog-post-${post.id}`}><Pencil className="h-4 w-4" /></Button><Button size="sm" variant="ghost" className="text-red-600" onClick={() => window.confirm(`Move "${post.title}" to trash?`) && deleteMutation.mutate(post)} data-testid={`button-delete-blog-post-${post.id}`}><Trash2 className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}