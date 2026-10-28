import assert from "node:assert/strict";
import test from "node:test";
import { MAX_HOMEPAGE_VIDEOS, videoSource, youtubeVideoId, driveEmbedSrc, driveFileId, driveThumbnail, driveWatchUrl, videoInputSchema } from "@/lib/videoTestimonials";
import { getVideoTestimonials } from "@/lib/content/videoTestimonialsStore";
import { storage } from "@/lib/storage";

const ID = "1AbCdEfGhIjKlMnOpQrStUvWxYz_-123";

test("Google Drive file ids are read from share links, and only from drive.google.com", () => {
  assert.equal(driveFileId(`https://drive.google.com/file/d/${ID}/view?usp=sharing`), ID);
  assert.equal(driveFileId(`https://drive.google.com/file/u/0/d/${ID}/view`), ID);
  assert.equal(driveFileId(`https://drive.google.com/open?id=${ID}`), ID);
  assert.equal(driveFileId(`https://drive.google.com/uc?export=download&id=${ID}`), ID);
  assert.equal(driveFileId(`http://drive.google.com/file/d/${ID}/view`), null, "must be https");
  assert.equal(driveFileId(`https://drive.google.com.evil.example/file/d/${ID}/view`), null);
  assert.equal(driveFileId(`https://evil.example/?u=https://drive.google.com/file/d/${ID}/view`), null);
  assert.equal(driveFileId("https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz"), null, "a folder is not a video");
  assert.equal(driveFileId("not a link"), null);
  assert.equal(driveEmbedSrc(ID), `https://drive.google.com/file/d/${ID}/preview`);
  assert.equal(driveWatchUrl(ID), `https://drive.google.com/file/d/${ID}/view`);
  assert.ok(driveThumbnail(ID).startsWith("https://drive.google.com/thumbnail?id="));
});

test("YouTube ids are read from every share-link shape, and only from youtube hosts", () => {
  const Y = "dQw4w9WgXcQ";
  for (const url of [`https://www.youtube.com/watch?v=${Y}&t=5`, `https://youtu.be/${Y}?si=x`, `https://m.youtube.com/watch?v=${Y}`, `https://www.youtube.com/shorts/${Y}`, `https://www.youtube.com/embed/${Y}`, `https://www.youtube.com/live/${Y}`]) {
    assert.equal(youtubeVideoId(url), Y, url);
  }
  assert.equal(youtubeVideoId(`http://youtu.be/${Y}`), null, "must be https");
  assert.equal(youtubeVideoId(`https://youtube.com.evil.example/watch?v=${Y}`), null);
  assert.equal(youtubeVideoId(`https://evil.example/?u=https://youtu.be/${Y}`), null);
  const source = videoSource(`https://youtu.be/${Y}`)!;
  assert.equal(source.kind, "youtube");
  assert.ok(source.embedSrc.startsWith(`https://www.youtube-nocookie.com/embed/${Y}`));
  assert.equal(videoSource(`https://drive.google.com/file/d/${ID}/view`)!.kind, "drive");
  assert.equal(videoSource("https://example.com/video.mp4"), null);
});

test("video form: needs a video link, checks the cover image", () => {
  const ok = { url: `https://drive.google.com/file/d/${ID}/view`, name: "Sarah M.", role: "Parent of U12 player", quote: "", poster: "", visible: true };
  assert.ok(videoInputSchema.safeParse(ok).success);
  assert.ok(!videoInputSchema.safeParse({ ...ok, url: "https://youtube.com/watch?v=abc" }).success, "id must be 11 characters");
  assert.ok(videoInputSchema.safeParse({ ...ok, url: "https://youtu.be/dQw4w9WgXcQ" }).success);
  assert.ok(!videoInputSchema.safeParse({ ...ok, url: "https://vimeo.com/12345" }).success);
  assert.ok(!videoInputSchema.safeParse({ ...ok, url: "" }).success);
  assert.ok(videoInputSchema.safeParse({ ...ok, name: " " }).success, "name is optional");
  assert.equal(videoInputSchema.parse({ ...ok, name: undefined }).name, "");
  assert.ok(!videoInputSchema.safeParse({ ...ok, poster: "http://insecure.example/a.jpg" }).success);
  assert.ok(videoInputSchema.safeParse({ ...ok, role: "", poster: "https://cdn.example.com/a.jpg" }).success);
});

test("site videos: only visible ones, in admin order, capped, and a database error shows none", async () => {
  const original = storage.getVideoTestimonials;
  const row = (id: number, visible: boolean) => ({ id, url: `https://drive.google.com/file/d/${ID}${id}/view`, name: `Person ${id}`, role: "", quote: "", poster: null, sortOrder: id, visible, createdAt: new Date(), updatedAt: new Date() });
  try {
    storage.getVideoTestimonials = (async () => [row(1, true), row(2, false), row(3, true)]) as typeof storage.getVideoTestimonials;
    assert.deepEqual((await getVideoTestimonials()).map((video) => video.id), [1, 3]);

    storage.getVideoTestimonials = (async () => Array.from({ length: MAX_HOMEPAGE_VIDEOS + 3 }, (_, index) => row(index + 1, true))) as typeof storage.getVideoTestimonials;
    assert.equal((await getVideoTestimonials()).length, MAX_HOMEPAGE_VIDEOS);

    storage.getVideoTestimonials = (async () => { throw new Error("db down"); }) as typeof storage.getVideoTestimonials;
    assert.deepEqual(await getVideoTestimonials(), []);
  } finally {
    storage.getVideoTestimonials = original;
  }
});
