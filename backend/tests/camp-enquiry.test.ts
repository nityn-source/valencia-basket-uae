import assert from "node:assert/strict";
import test from "node:test";
import { ageGroupFor, campEnquiryFormSchema } from "@shared/schema";

const valid = {
  camp: "Week 1 Skill Lab",
  playerName: "John Doe",
  playerAge: 11,
  gender: "Boy",
  parentName: "Jane Doe",
  email: "Jane@Example.com",
  phone: "+971501234567",
  whatsapp: true,
  sourcePage: "camp-winter-camp-2026",
};

test("a complete camp enquiry passes and the email is tidied", () => {
  const parsed = campEnquiryFormSchema.parse(valid);
  assert.equal(parsed.email, "jane@example.com");
  assert.equal(parsed.utmSource, "direct");
});

test("each required camp field is checked", () => {
  for (const [key, bad] of [["camp", ""], ["playerName", "J"], ["playerAge", 2], ["gender", "Other"], ["parentName", ""], ["email", "nope"], ["phone", "123"]] as const) {
    assert.equal(campEnquiryFormSchema.safeParse({ ...valid, [key]: bad }).success, false, `${key} should be rejected`);
  }
});

test("only camp pages can use the camp enquiry source tag", () => {
  assert.equal(campEnquiryFormSchema.safeParse({ ...valid, sourcePage: "home" }).success, false);
  assert.equal(campEnquiryFormSchema.safeParse({ ...valid, website: "spam" }).success, false);
});

test("the exact age maps onto the age groups the admin already uses", () => {
  assert.equal(ageGroupFor(5), "4–6 years");
  assert.equal(ageGroupFor(8), "7–10 years");
  assert.equal(ageGroupFor(14), "11–18 years");
});
