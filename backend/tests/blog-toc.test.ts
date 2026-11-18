import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { TOC_MIN_H2, buildArticleToc, headingText, slugifyHeading } from "@/lib/blogToc";

const article = `<p>Intro one.</p><p>Intro two.</p>
<h2>What Are Custom Insoles?</h2><p>a</p>
<h2>Benefits of Custom Insoles</h2><p>b</p>
<h3>Improved Foot Support</h3><p>c</p>
<h3>Better Pressure Distribution</h3><p>d</p>
<h2>How to Choose the Right Insoles</h2><p>e</p>
<h2>Frequently Asked Questions</h2><p>f</p>`;

test("contents are built from H2 and H3 headings with 1 / 1.1 numbering", () => {
  const toc = buildArticleToc(article);
  assert.equal(toc.enabled, true);
  assert.deepEqual(
    toc.items.map((item) => [item.number, item.text, item.children.map((child) => `${child.number} ${child.text}`)]),
    [
      ["1", "What Are Custom Insoles?", []],
      ["2", "Benefits of Custom Insoles", ["2.1 Improved Foot Support", "2.2 Better Pressure Distribution"]],
      ["3", "How to Choose the Right Insoles", []],
      ["4", "Frequently Asked Questions", []],
    ],
  );
});

test("each heading gets a readable, unique id and the text is otherwise untouched", () => {
  const toc = buildArticleToc(article);
  assert.match(toc.html, /<h2 id="what-are-custom-insoles">What Are Custom Insoles\?<\/h2>/);
  assert.match(toc.html, /<h3 id="improved-foot-support">Improved Foot Support<\/h3>/);
  assert.equal(toc.html.replace(/ id="[^"]*"/g, ""), article);
  const ids = [...toc.html.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
});

test("repeated headings get -2, -3 and an existing id is replaced, not duplicated", () => {
  const toc = buildArticleToc('<h2>Tips</h2><h2 id="old" class="x">Tips</h2><h2>Tips</h2>');
  assert.deepEqual(toc.items.map((item) => item.id), ["tips", "tips-2", "tips-3"]);
  assert.match(toc.html, /<h2 class="x" id="tips-2">/);
  assert.equal((toc.html.match(/id="old"/g) ?? []).length, 0);
});

test("the box needs at least 3 H2 headings", () => {
  assert.equal(TOC_MIN_H2, 3);
  assert.equal(buildArticleToc("<h2>A</h2><h2>B</h2><h3>C</h3><h3>D</h3>").enabled, false);
  assert.equal(buildArticleToc("<h2>A</h2><h2>B</h2><h2>C</h2>").enabled, true);
  assert.equal(buildArticleToc("<p>No headings.</p>").enabled, false);
});

test("the box goes just before the first H2, after the intro", () => {
  const toc = buildArticleToc(article);
  assert.equal(toc.html.slice(toc.insertAt).startsWith('<h2 id="what-are-custom-insoles">'), true);
  assert.match(toc.html.slice(0, toc.insertAt), /Intro two\.<\/p>\s*$/);
});

test("when the first H2 sits inside another element, the box goes at the top instead", () => {
  const toc = buildArticleToc("<p>Intro</p><div><h2>A</h2><h2>B</h2><h2>C</h2></div>");
  assert.equal(toc.insertAt, 0);
});

test("H4 and lower, and empty headings, are left out", () => {
  const toc = buildArticleToc("<h2>A</h2><h4>Small</h4><h2></h2><h2><br></h2><h2>B</h2><h2>C</h2>");
  assert.deepEqual(toc.items.map((item) => item.text), ["A", "B", "C"]);
  assert.doesNotMatch(toc.html, /<h4[^>]* id=/);
});

test("heading text drops inline tags and decodes entities; ids are plain", () => {
  assert.equal(headingText("Pros &amp; <em>Cons</em> of&nbsp;Training"), "Pros & Cons of Training");
  assert.equal(slugifyHeading("Why Do Custom Insoles Cost More?"), "why-do-custom-insoles-cost-more");
  assert.equal(slugifyHeading("Pros & Cons"), "pros-and-cons");
  assert.equal(slugifyHeading("Café – Ages 4–6"), "cafe-ages-4-6");
  assert.equal(slugifyHeading("???"), "section");
  assert.equal(
    slugifyHeading("Choosing a Programme by Age and Why It Matters for Long Heading Wrapping on Phones"),
    "choosing-a-programme-by-age-and-why-it-matters-for-long-heading-wrapping-on",
  );
});

test("an H3 before any H2 still gets an entry", () => {
  const toc = buildArticleToc("<h3>Early</h3><h2>A</h2><h2>B</h2><h2>C</h2>");
  assert.deepEqual(toc.items.map((item) => item.text), ["Early", "A", "B", "C"]);
});

test("the article page shows the box from the contents helper, and the link targets stay clear of the navbar", () => {
  const page = readFileSync(resolve(process.cwd(), "components/blog/BlogArticle.tsx"), "utf8");
  const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
  assert.match(page, /buildArticleToc\(safeContent\)/);
  assert.match(page, /toc\?\.enabled/);
  assert.match(page, /<BlogToc items=\{toc\.items\} \/>/);
  assert.match(css, /\.blog-content h2\[id\][\s\S]*scroll-margin-top/);
});
