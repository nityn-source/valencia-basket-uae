import { z } from "zod";

/**
 * Optional structured content for a camp-style event page (events.details).
 * Events without it keep the standard event layout. Every text here is edited
 * in Admin → Events → the event → "Camp page" tab.
 */
const text = (max = 600) => z.string().trim().max(max).default("");

export const campProgrammeSchema = z.object({
  /** Short stable key, used for the registration dropdown and the Classcard utm_content tag. */
  id: z.string().trim().min(1).max(40),
  weekLabel: text(40),
  name: z.string().trim().min(1).max(80),
  tagline: text(160),
  venue: text(120),
  dates: text(120),
  /** One line each, e.g. "Monday to Thursday: 5:00 PM - 8:00 PM". */
  timeLines: z.array(z.string().trim().max(160)).default([]),
  fee: text(40),
  intro: text(300),
  heading: text(160),
  bullets: z.array(z.object({ title: z.string().trim().max(160), text: text(300) })).default([]),
  /** Label shown in the registration dropdown. */
  optionLabel: z.string().trim().min(1).max(120),
  /** Classcard registration page. utm tags are added automatically. */
  classcardUrl: z.string().trim().max(500).default(""),
});

export const campDetailsSchema = z.object({
  /** YYYY-MM-DD, used for Google's event listing (the display date is free text). */
  startDate: text(10),
  headline: text(160),
  subtext: text(500),
  strip: z.array(z.string().trim().max(80)).default([]),
  ctaLabel: text(40),
  whatsappLabel: text(40),
  openFor: text(80),
  programmes: z.array(campProgrammeSchema).default([]),
  introTitle: text(120),
  introText: text(1200),
  fees: z
    .object({
      title: text(120),
      rows: z
        .array(z.object({ name: z.string().trim().max(80), dates: text(120), fee: text(40), best: z.boolean().default(false) }))
        .default([]),
      note: text(200),
    })
    .default({ title: "", rows: [], note: "" }),
  scheduleTitle: text(120),
  /** Each table: header cells, then rows. Cells are separated by " | " in the admin editor. */
  schedules: z
    .array(
      z.object({
        title: z.string().trim().max(80),
        headers: z.array(z.string().trim().max(60)).default([]),
        rows: z.array(z.array(z.string().trim().max(160))).default([]),
      }),
    )
    .default([]),
  coachesTitle: text(120),
  coaches: z
    .array(z.object({ name: z.string().trim().max(80), title: text(120), credential: text(200), photo: text(500) }))
    .default([]),
  reelsTitle: text(120),
  reelsText: text(200),
  reels: z.array(z.object({ url: z.string().trim().max(300), caption: text(120) })).default([]),
  facebookReelUrl: text(300),
  whyTitle: text(120),
  why: z.array(z.string().trim().max(200)).default([]),
  groupsTitle: text(120),
  groupsText: z.array(z.string().trim().max(900)).default([]),
  groupsImage: text(500),
  leaveTitle: text(120),
  leaves: z.array(z.object({ icon: text(8), title: z.string().trim().max(80), text: text(120) })).default([]),
  systemTitle: text(120),
  system: z.array(z.object({ title: z.string().trim().max(120), text: text(300) })).default([]),
  motto: text(80),
  mottoSub: text(80),
  formTitle: text(120),
  formIntro: text(300),
  formLabel: text(120),
  formPlaceholder: text(80),
  formButton: text(60),
  formError: text(120),
  faqTitle: text(120),
  faqs: z.array(z.object({ question: z.string().trim().max(200), answer: z.string().trim().max(800) })).default([]),
  contactTitle: text(120),
  phone: text(40),
  whatsappUrl: text(300),
  email: text(120),
  heroImage: text(500),
});

export type CampProgramme = z.infer<typeof campProgrammeSchema>;
export type CampDetails = z.infer<typeof campDetailsSchema>;
