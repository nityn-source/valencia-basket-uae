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

test("the event registration migration only adds columns, with defaults, and is in the journal", async () => {
  const { readFileSync } = await import("node:fs");
  const sql = readFileSync("migrations/0017_event_registration_camp_fields.sql", "utf8");
  assert.doesNotMatch(sql, /DROP|TRUNCATE|DELETE|RENAME|ALTER COLUMN/i);
  const adds = sql.match(/ADD COLUMN IF NOT EXISTS "[a-z_]+" [a-z]+ DEFAULT [^;]+? NOT NULL/g) ?? [];
  assert.equal(adds.length, 9, "every new column is NOT NULL with a default, so existing rows and old sign-ups keep working");
  const journal = JSON.parse(readFileSync("migrations/meta/_journal.json", "utf8")) as { entries: { tag: string }[] };
  assert.equal(journal.entries.at(-1)?.tag, "0017_event_registration_camp_fields");
});

test("event sign-ups that don't use the camp form still validate without the new fields", async () => {
  const { insertEventRegistrationSchema } = await import("@shared/schema");
  assert.doesNotThrow(() =>
    insertEventRegistrationSchema.parse({ eventId: "e1", eventTitle: "Summer Camp", parentName: "Jane Doe", email: "j@example.com", phone: "+971501234567", playerName: "Kid", playerAge: 9 }),
  );
});
