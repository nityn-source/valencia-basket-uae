import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { CONTENT_FIELDS, getContentField } from "@/lib/content/pageContent";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "admin" || name === "api" ? [] : sourceFiles(path);
    return /\.tsx$/.test(name) ? [path] : [];
  });
}

test("page content keys are unique and every field has a label and default", () => {
  const keys = CONTENT_FIELDS.map((field) => field.key);
  assert.equal(keys.length, new Set(keys).size, "duplicate content keys");
  for (const field of CONTENT_FIELDS) {
    assert.ok(field.label.trim(), `${field.key} has no label`);
    assert.ok(field.default.trim(), `${field.key} has no default`);
    if (field.maxLength) assert.ok(field.default.length <= field.maxLength, `${field.key} default is longer than its limit`);
  }
});

test("every literal content key used by a public page exists, so no page can crash on an unknown field", () => {
  const used = new Set<string>();
  for (const file of [...sourceFiles("app"), ...sourceFiles("components")]) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/\b(?:c|t|getContent)\(\s*["'`]([a-z0-9.-]+)["'`]\s*\)/g)) used.add(match[1]);
  }
  assert.ok(used.size > 100, "expected the pages to use many content keys");
  for (const key of used) assert.ok(getContentField(key), `unknown content key "${key}"`);
});
