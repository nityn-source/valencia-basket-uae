"use client";

import { useQuery } from "@tanstack/react-query";
import { DEFAULT_BLOG_AUTHOR } from "@/lib/blog";
import { authorDisplayName, matchAuthor, type StaffMember } from "@/lib/content/staff";

/** Visible staff blog authors (from Admin → Staff). */
export function useBlogAuthors() {
  const { data = [] } = useQuery<{ members: StaffMember[] }, Error, StaffMember[]>({
    queryKey: ["admin-staff"],
    queryFn: async () => {
      const res = await fetch("/api/admin/staff");
      if (!res.ok) throw new Error("Failed to load staff");
      return res.json();
    },
    select: (data) => data.members.filter((member) => member.isAuthor && member.visible),
  });
  return data;
}

/**
 * Author picker: the academy itself or a staff blog author. A stored name that
 * matches an author ("Coach Maros Kovacik") shows as that author; any other
 * older free-text name stays listed so it is never silently replaced.
 */
export function BlogAuthorSelect({ value, onChange, className, ...props }: {
  value: string;
  onChange: (authorName: string) => void;
  className?: string;
  disabled?: boolean;
  "aria-label"?: string;
  "data-testid"?: string;
}) {
  const authors = useBlogAuthors();
  const names = authors.map(authorDisplayName);
  const matched = matchAuthor(authors, value);
  const selected = matched ? authorDisplayName(matched) : value;
  const options = [...new Set([DEFAULT_BLOG_AUTHOR, ...names, selected].filter(Boolean))];
  return (
    <select
      {...props}
      value={selected}
      onChange={(event) => onChange(event.target.value)}
      className={className ?? "h-10 w-full border border-gray-300 bg-white px-3 text-sm"}
    >
      {options.map((name) => <option key={name} value={name}>{name}</option>)}
    </select>
  );
}
