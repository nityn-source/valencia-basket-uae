import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";
import { LEGACY_IMAGES, isLegacyImagePath } from "@/lib/content/legacyImages";
import { resolveImageSrc } from "@/lib/utils";

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

test("every original photo is restored at its old address, and listed", () => {
  const onDisk = filesUnder(join(process.cwd(), "public/images")).map((path) => relative(join(process.cwd(), "public/images"), path)).sort();
  assert.equal(onDisk.length, 35);
  assert.deepEqual(onDisk, [...LEGACY_IMAGES].sort(), "public/images and LEGACY_IMAGES must list the same files");
});

test("original photos keep their /images address; other /images paths go to R2", () => {
  assert.equal(isLegacyImagePath("/images/hero-players-2.jpg"), true);
  assert.equal(isLegacyImagePath("/images/coach_new/saiid.jpeg"), true);
  assert.equal(isLegacyImagePath("/images/not-an-original.jpg"), false);
  assert.equal(resolveImageSrc("/images/mini-basket-team.jpg"), "/images/mini-basket-team.jpg");
  assert.equal(resolveImageSrc("/images/uploaded-later.jpg"), "https://pub-b2680f6e721d4a92b41f30395b8feb3c.r2.dev/uploaded-later.jpg");
  assert.equal(resolveImageSrc("https://pub-b2680f6e721d4a92b41f30395b8feb3c.r2.dev/blog/x.webp"), "https://pub-b2680f6e721d4a92b41f30395b8feb3c.r2.dev/blog/x.webp");
});
