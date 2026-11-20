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
  assert.match(card, /<FilmDialog/);
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

test("event cards show the film in place of the photo only for events that have a Vimeo film, with an overlay link instead of one big link", () => {
  const strip = file("components/home/EventStrip.tsx");
  const page = file("app/events/page.tsx");
  for (const source of [strip, page]) {
    assert.match(source, /parseVimeo\(event\.details\?\.heroVideo\)/);
    assert.match(source, /<EventCardVideo/);
    assert.match(source, /className="absolute inset-0 z-10"/, "the card link is an overlay under the film");
  }
  // events without a film keep the original card (one link around the photo card)
  assert.match(strip, /<Link key=\{event\.id\} href=\{`\/events\/\$\{event\.slug\}`\} data-testid=\{`link-event-strip-\$\{event\.slug\}`\}>/);
  assert.match(page, /<Link href=\{`\/events\/\$\{event\.slug\}`\} data-testid=\{`link-event-\$\{event\.slug\}`\}>/);
});

test("the card film waits for the page and the card to be seen, never starts sound itself, and opens the shared sound player", () => {
  const card = file("components/events/EventCardVideo.tsx");
  assert.match(card, /new IntersectionObserver/);
  assert.match(card, /document\.readyState === "complete"/);
  assert.match(card, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(card, /setMuted|setVolume/, "no automatic sound on a card");
  assert.match(card, /<FilmDialog/);
  assert.match(file("components/events/FilmDialog.tsx"), /vimeoPlayerSrc\(video, "sound"\)/);
});

test("the sound player pop-up keeps focus on itself (so Escape closes it) and hands focus back to the film when it closes", () => {
  const dialog = file("components/events/FilmDialog.tsx");
  assert.match(dialog, /onOpenAutoFocus=\{\(event\) => \{ event\.preventDefault\(\); \(event\.currentTarget as HTMLElement \| null\)\?\.focus\(\); \}\}/);
  assert.match(dialog, /onCloseAutoFocus=\{\(event\) => \{ event\.preventDefault\(\); window\.setTimeout\(\(\) => onCloseFocus\?\.\(\), 0\); \}\}/);
  assert.match(dialog, /vimeoPlayerSrc\(video, "sound"\)/);
});

test("the event card film is a poster: 9:16 frame, white border, orange offset block, orange line across the top of the card", () => {
  const film = file("components/events/EventCardVideo.tsx");
  assert.match(film, /border-\[3px\] border-white/);
  assert.match(film, /shadow-\[10px_10px_0_#ff6c0e\]/);
  assert.match(film, /aspectRatio: ratio/);
  for (const source of [file("components/home/EventStrip.tsx"), file("app/events/page.tsx")]) {
    assert.match(source, /border-t-4[^"]*border-t-primary/);
    assert.match(source, /campCardTags\(event\.details\)/);
  }
});

test("card tags come from the camp page: each camp's name, then the ages", async () => {
  const { campCardTags } = await import("@/lib/campTags");
  const details = campDetailsSchema.parse({
    openFor: "Open for Ages 8 - 18",
    programmes: [
      { id: "a", weekLabel: "Camp 1", name: "Skill Lab", optionLabel: "Skill Lab", timeLines: [] },
      { id: "b", weekLabel: "Camp 2", name: "Shooting Lab", optionLabel: "Shooting Lab", timeLines: [] },
      { id: "both", weekLabel: "", name: "Both Weeks", optionLabel: "Both", timeLines: [] },
    ],
  });
  assert.deepEqual(campCardTags(details), ["Skill Lab", "Shooting Lab", "Ages 8–18"]);
  assert.deepEqual(campCardTags(null), []);
  assert.deepEqual(campCardTags(campDetailsSchema.parse({})), []);
});
