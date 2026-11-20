import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { campDetailsSchema } from "@shared/campDetails";
import { formatDuration, parseVimeo, vimeoPageUrl, vimeoPlayerSrc } from "@/lib/vimeo";

const file = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("Vimeo links: the video id is read from every common link shape, and only from Vimeo", () => {
  assert.deepEqual(parseVimeo("https://vimeo.com/1248302235"), { id: "1248302235", hash: null });
  assert.deepEqual(parseVimeo("https://www.vimeo.com/1248302235?share=copy"), { id: "1248302235", hash: null });
  assert.deepEqual(parseVimeo("https://vimeo.com/1248302235/a1b2c3d4e5"), { id: "1248302235", hash: "a1b2c3d4e5" });
  assert.deepEqual(parseVimeo("https://player.vimeo.com/video/1248302235?h=a1b2c3d4e5&badge=0"), { id: "1248302235", hash: "a1b2c3d4e5" });
  assert.deepEqual(parseVimeo("https://vimeo.com/channels/staffpicks/1248302235"), { id: "1248302235", hash: null });
  for (const bad of ["", "   ", "not a link", "http://vimeo.com/1248302235", "https://vimeo.com/", "https://vimeo.com/user", "https://evil.example/vimeo.com/1248302235", "https://vimeo.com.evil.example/1248302235", "https://youtube.com/watch?v=1248302235", "javascript:alert(1)"]) {
    assert.equal(parseVimeo(bad), null, bad);
  }
  assert.equal(parseVimeo(null), null);
  assert.equal(parseVimeo(undefined), null);
});

test("an unsafe privacy hash is dropped, not put in the player address", () => {
  assert.equal(parseVimeo("https://player.vimeo.com/video/1248302235?h=abc%22%3E%3Cscript")?.hash, null);
});

test("the silent loop and the sound player are asked not to track, and only the loop is muted", () => {
  const video = { id: "1248302235", hash: null };
  const loop = new URL(vimeoPlayerSrc(video, "loop"));
  assert.equal(loop.origin + loop.pathname, "https://player.vimeo.com/video/1248302235");
  for (const [key, value] of [["dnt", "1"], ["autoplay", "1"], ["muted", "1"], ["loop", "1"], ["controls", "0"], ["playsinline", "1"]]) assert.equal(loop.searchParams.get(key), value, key);
  const sound = new URL(vimeoPlayerSrc({ id: "1248302235", hash: "a1b2c3d4e5" }, "sound"));
  assert.equal(sound.searchParams.get("h"), "a1b2c3d4e5");
  assert.equal(sound.searchParams.get("dnt"), "1");
  assert.equal(sound.searchParams.get("muted"), null);
  assert.equal(sound.searchParams.get("controls"), null);
  assert.equal(vimeoPageUrl({ id: "1248302235", hash: "a1b2c3d4e5" }), "https://vimeo.com/1248302235/a1b2c3d4e5");
});

test("durations read as minutes and seconds", () => {
  assert.equal(formatDuration(50), "0:50");
  assert.equal(formatDuration(65), "1:05");
  assert.equal(formatDuration(0), "0:00");
});

test("the camp page editor accepts an empty film link or a Vimeo link, and rejects anything else", () => {
  const base = campDetailsSchema.parse({});
  assert.equal(base.heroVideo, "");
  assert.equal(campDetailsSchema.parse({ heroVideo: "https://vimeo.com/1248302235" }).heroVideo, "https://vimeo.com/1248302235");
  assert.equal(campDetailsSchema.safeParse({ heroVideo: "https://youtube.com/watch?v=abc" }).success, false);
  assert.equal(campDetailsSchema.safeParse({ heroVideo: "hello" }).success, false);
});

test("the film hero only appears when a Vimeo link is set; without one the original hero stays", () => {
  const page = file("components/events/CampEventPage.tsx");
  assert.match(page, /const video = parseVimeo\(d\.heroVideo\);/);
  assert.match(page, /\{film \? \([\s\S]*data-testid="camp-hero-film"[\s\S]*\) : \(\s*<div className="grid lg:grid-cols-\[1\.05fr_\.95fr\]">/);
  assert.match(page, /className="camp-photo relative min-h-\[280px\]/, "the original photo hero is still there");
  // the photo behind the text is the hero photo, blurred (not a frame of the film)
  assert.match(page, /<Image src=\{heroImage\} alt="" fill priority[^>]*blur-\[20px\]/);
});

test("the film card is an exact 9:16 box, starts after load, and respects reduced motion and data saving", () => {
  const card = file("components/events/CampHeroVideo.tsx");
  assert.match(card, /aspectRatio: ratio/);
  assert.match(card, /prefers-reduced-motion: reduce/);
  assert.match(card, /saveData/);
  assert.match(card, /addEventListener\("load", start/);
  assert.match(card, /const loopLive = loopOn && !open;/);
  assert.match(card, /onCloseAutoFocus/);
});

test("the camp editor has a film field that explains what it does", () => {
  const editor = file("app/admin/CampPageEditor.tsx");
  assert.match(editor, /label="Camp film \(Vimeo link, optional\)"/);
  assert.match(editor, /set\("heroVideo", v\)/);
});

test("the first tap or key press starts the sound, only while the film is on screen, and the visitor can mute it", () => {
  const card = file("components/events/CampHeroVideo.tsx");
  assert.match(card, /addEventListener\("pointerdown", first/);
  assert.match(card, /addEventListener\("keydown", first/);
  assert.match(card, /intersectionRatio >= 0\.5/);
  assert.match(card, /!onScreen\.current/, "no sound when the film is scrolled out of view");
  assert.match(card, /chosenMute\.current/, "a visitor who muted stays muted");
  assert.match(card, /send\("setMuted", !on\)/);
  assert.match(card, /data-sound-toggle/);
  assert.match(card, /Mute/);
});
