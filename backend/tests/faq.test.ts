import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_FAQS, FAQ_SECTION_IDS, faqAnswerPlainText, faqInputSchema, isSafeFaqHref, parseFaqAnswer, slugifyQuestion } from "@/lib/content/faq";
import { buildFaqStructuredData } from "@/lib/seo/structuredData";

test("default FAQs: unique slugs, known sections, every section has questions", () => {
  const slugs = DEFAULT_FAQS.map((item) => item.slug);
  assert.equal(slugs.length, new Set(slugs).size);
  for (const item of DEFAULT_FAQS) assert.ok(FAQ_SECTION_IDS.includes(item.section));
  for (const id of FAQ_SECTION_IDS) assert.ok(DEFAULT_FAQS.some((item) => item.section === id));
});

test("answers parse into paragraphs, lists and safe links", () => {
  const blocks = parseFaqAnswer("Intro\n\n1. One\n2. Two\n\n- a\n- b\n\nSee [us](/facilities) and [bad](javascript:alert(1)).");
  assert.deepEqual(blocks.map((block) => block.type), ["paragraph", "ordered", "bulleted", "paragraph"]);
  const last = blocks[3];
  assert.ok(last.type === "paragraph");
  assert.deepEqual(last.lines[0].filter((part) => part.type === "link").map((part) => part.type === "link" && part.href), ["/facilities"]);
  assert.ok(isSafeFaqHref("mailto:a@b.ae") && isSafeFaqHref("https://x.ae") && !isSafeFaqHref("//evil.example") && !isSafeFaqHref("javascript:alert(1)"));
});

test("schema text is plain: link text kept, 'read more →' links dropped, lists flattened", () => {
  assert.equal(faqAnswerPlainText("Fill in the [form](/#book-trial) today."), "Fill in the form today.");
  assert.equal(faqAnswerPlainText("We train at Arena. [Directions →](/facilities)"), "We train at Arena.");
  assert.equal(faqAnswerPlainText("Programs:\n\n1. A\n2. B"), "Programs: A, B.");
});

test("FAQPage schema lists the given questions", () => {
  const schema = buildFaqStructuredData(DEFAULT_FAQS);
  assert.equal(schema["@type"], "FAQPage");
  assert.equal(schema.mainEntity.length, DEFAULT_FAQS.length);
  assert.ok(schema.mainEntity.every((entry) => entry.acceptedAnswer.text.length > 0 && !/\]\(/.test(entry.acceptedAnswer.text)));
});

test("input validation and slugs", () => {
  assert.ok(!faqInputSchema.safeParse({ section: "about", question: " ", answer: "x", visible: true }).success);
  assert.ok(!faqInputSchema.safeParse({ section: "nope", question: "q", answer: "x", visible: true }).success);
  assert.ok(faqInputSchema.safeParse({ section: "about", question: "q?", answer: "x", visible: false }).success);
  assert.equal(slugifyQuestion("Can I register my child from anywhere in Dubai?"), "can-i-register-my-child-from-anywhere-in-dubai");
});
