import { z } from "zod";

/**
 * FAQ page (/faqs) questions. The live list is stored in the faq_items table
 * and edited in Admin → FAQs; DEFAULT_FAQS below is what the table starts
 * with and what the site shows until it's filled. Client-safe: no database
 * access here (see faqStore.ts).
 *
 * Answers are plain text with light formatting:
 *   - a blank line starts a new paragraph
 *   - lines starting "1. ", "2. " … make a numbered list
 *   - lines starting "- " make a bulleted list
 *   - [link text](/page) or [link text](https://…) makes a link
 */

export const FAQ_SECTIONS = [
  { id: "about", title: "About the Academy" },
  { id: "programs", title: "Programs and Age Groups" },
  { id: "registration", title: "Trials, Registration and Fees" },
  { id: "schedule", title: "Schedule and Location" },
  { id: "health", title: "Attendance, Health and Safety" },
  { id: "parents", title: "Parents and Communication" },
] as const;

export type FaqSectionId = (typeof FAQ_SECTIONS)[number]["id"];
export const FAQ_SECTION_IDS = FAQ_SECTIONS.map((section) => section.id) as [FaqSectionId, ...FaqSectionId[]];

export interface FaqItem {
  id: number | null;
  slug: string;
  section: FaqSectionId;
  question: string;
  answer: string;
  sortOrder: number;
  visible: boolean;
}

export const FAQ_LIMITS = { question: 200, answer: 3000 } as const;

type DefaultFaq = Pick<FaqItem, "slug" | "section" | "question" | "answer">;

const DEFAULTS: DefaultFaq[] = [
  {
    slug: "what-is-vba",
    section: "about",
    question: "What does Valencia Basket Academy UAE do?",
    answer: "Valencia Basket Academy UAE is a youth basketball academy in Dubai for children aged 4 to 18, training at AllSports Arena in Al Quoz. We run three age-based programs designed around how young players actually develop, not a one-size-fits-all class.",
  },
  {
    slug: "spain-connection",
    section: "about",
    question: "Is Valencia Basket Academy UAE officially connected to Valencia Basket in Spain?",
    answer: "Yes. Valencia Basket Academy UAE operates as an official academy partner of Valencia Basket, one of Spain's leading professional basketball clubs. [Read more about our methodology and Spain connection →](/methodology)",
  },
  {
    slug: "location",
    section: "about",
    question: "Where are you located?",
    answer: "We train at AllSports Arena, Al Quoz, Dubai. [Click for full directions and details →](/facilities)",
  },
  {
    slug: "programs-offered",
    section: "programs",
    question: "What programs do you offer, and what age is each for?",
    answer: [
      "We offer three age-based programs:",
      "1. Future Ballers for ages 4 to 6\n2. Mini Basket for ages 7 to 10\n3. Youth Academy for ages 11 to 18",
      "Each program uses age-appropriate coaching, so players are grouped with peers at a similar stage of development.",
      "We also have a Private Training program where a player can further enhance their skills. This program offers smaller batch training as well as 1-on-1 sessions.",
    ].join("\n\n"),
  },
  {
    slug: "beginners",
    section: "programs",
    question: "My child has never played basketball before, can they still join?",
    answer: "Yes. All three programs are built to take in complete beginners alongside more experienced players. Coaches adjust drills and pacing to each child's current ability, so no prior experience is needed to start.",
  },
  {
    slug: "competitive",
    section: "programs",
    question: "Do you offer a competitive or selection-based track?",
    answer: "Yes. Alongside our three core programs, we run an Elite/Select tier for players ready for a higher level of competition. Entry is invitation-only, based on tryouts, and coaches invite players they feel are ready.",
  },
  {
    slug: "evaluation",
    section: "programs",
    question: "What will players be evaluated on?",
    answer: "Players are assessed according to Valencia Basket's methodology and curriculum developed in Spain. The assessment covers their understanding of the game, shooting, read-and-react ability, ball handling, court vision, decision-making, and their understanding of the Spanish style and system of play.",
  },
  {
    slug: "season",
    section: "programs",
    question: "When does the season start and end?",
    answer: "The season runs in three terms: Term 1 (September to December), Term 2 (January to March), and Term 3 (April to June).",
  },
  {
    slug: "anywhere-in-dubai",
    section: "programs",
    question: "Can I register my child from anywhere in Dubai?",
    answer: "Absolutely. Families join us from all across Dubai, from Dubai Marina, JBR, Palm Jumeirah and JVC to Al Barsha, Jumeirah, Downtown Dubai, Business Bay, Dubai Hills Estate, Mirdif, Deira, Bur Dubai, Dubai Silicon Oasis, Dubailand and Dubai South. When you fill in the registration form, simply select the area you’ll be coming from, and our team will take it from there.",
  },
  {
    slug: "book-trial",
    section: "registration",
    question: "How do I book a free trial?",
    answer: "Fill in the [Book a Free Trial form](/#book-trial) on our website with your child's name, age group, and your contact details, or message us directly on WhatsApp. We'll confirm a trial session at AllSports Arena.",
  },
  {
    slug: "documents",
    section: "registration",
    question: "What documents do I need to register?",
    answer: "We require a copy of the participant's passport or Emirates ID so that the necessary documents are available if the player participates in tournaments or represents the country. A medical form may also be requested when required by tournament organisers.",
  },
  {
    slug: "refund",
    section: "registration",
    question: "What is your refund policy?",
    answer: "Refunds may be provided depending on the participant's circumstances and the reason given. Where approved, the refund is issued as a cash refund rather than a credit note.",
  },
  {
    slug: "discounts",
    section: "registration",
    question: "Does Valencia Basket Academy UAE offer any discounts?",
    answer: "Yes, we offer a sibling discount for the second child. We also offer a specific discount for families who register for all three terms. However, we do not offer financial assistance.",
  },
  {
    slug: "training-times",
    section: "schedule",
    question: "What are your training days and times?",
    answer: "Our training sessions run Monday to Friday in the evenings. [Contact us on WhatsApp](https://wa.me/971544386838) to get an update on your ideal batch timing.",
  },
  {
    slug: "ramadan",
    section: "schedule",
    question: "Does the schedule change during Ramadan or public holidays?",
    answer: "Yes. During Ramadan, training times may shift to accommodate Iftar. Sessions falling on national or religious holidays are adjusted in advance, and families are notified ahead of any change.",
  },
  {
    slug: "ratio",
    section: "schedule",
    question: "What is the coach to player ratio?",
    answer: "There are at least two coaches, with a maximum of 15 players per group.",
  },
  {
    slug: "missed-session",
    section: "health",
    question: "What if my child misses a session, is a make-up class available?",
    answer: "There are no make-up sessions provided when a player misses a class.",
  },
  {
    slug: "medical-clearance",
    section: "health",
    question: "Does my child need any fitness or medical clearance to join?",
    answer: "Parents/guardians confirm at registration that their child is physically fit to take part in basketball training, and are asked to disclose any medical condition or special requirement relevant to safe participation.",
  },
  {
    slug: "insurance",
    section: "health",
    question: "Is insurance provided for participants?",
    answer: "Valencia Basket Academy UAE does not currently provide participant accident or injury insurance. Participation is therefore subject to the family's own responsibility and insurance arrangements.",
  },
  {
    slug: "kit",
    section: "health",
    question: "What should my child bring to training?",
    answer: "Players must bring their official academy kit, suitable basketball shoes, and a water bottle.",
  },
  {
    slug: "photos",
    section: "health",
    question: "Do you take photos or videos of participants during training?",
    answer: "We may photograph or film sessions and events for use on our website and social media, only where a parent or guardian has given consent. If you'd prefer your child not be included, you can let us know at registration or at any time afterward.",
  },
  {
    slug: "watching",
    section: "parents",
    question: "Can parents watch training sessions?",
    answer: "Yes, parents can observe from the designated viewing area during the training sessions.",
  },
  {
    slug: "updates",
    section: "parents",
    question: "How will I be updated about schedule changes or my child's progress?",
    answer: "Parents receive a detailed progress report every three months. The report outlines the player's strengths, positive development, areas requiring improvement, and technical progress.",
  },
  {
    slug: "contact",
    section: "parents",
    question: "How do I get in touch with the academy?",
    answer: "You can reach us by call or WhatsApp at [+971 54 438 6838](tel:+971544386838), or through the contact form on our website. You can also email us at [info@valenciabasket.ae](mailto:info@valenciabasket.ae).",
  },
];

export const DEFAULT_FAQS: FaqItem[] = FAQ_SECTIONS.flatMap((section) =>
  DEFAULTS.filter((item) => item.section === section.id).map((item, index) => ({ ...item, id: null, sortOrder: index, visible: true })),
);

/** Display order: by section, then by sortOrder within it. */
export function sortFaqs(items: FaqItem[]) {
  return [...items].sort(
    (a, b) => FAQ_SECTION_IDS.indexOf(a.section) - FAQ_SECTION_IDS.indexOf(b.section) || a.sortOrder - b.sortOrder || (a.id ?? 0) - (b.id ?? 0),
  );
}

export function slugifyQuestion(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "") || "question";
}

// ---- Answer formatting -------------------------------------------------

export type FaqInline = { type: "text"; text: string } | { type: "link"; text: string; href: string };
export type FaqBlock =
  | { type: "paragraph"; lines: FaqInline[][] }
  | { type: "ordered" | "bulleted"; items: FaqInline[][] };

const ORDERED_LINE = /^\s*\d+[.)]\s+/;
const BULLET_LINE = /^\s*[-•*]\s+/;
const LINK = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;

/** Links may only point at a page on this site, a web address, an email or a phone number. */
export function isSafeFaqHref(href: string) {
  return /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(href);
}

function parseInline(text: string): FaqInline[] {
  const parts: FaqInline[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const [whole, label, href] = match;
    if (!isSafeFaqHref(href)) continue;
    if (match.index > last) parts.push({ type: "text", text: text.slice(last, match.index) });
    parts.push({ type: "link", text: label, href });
    last = match.index + whole.length;
  }
  if (last < text.length) parts.push({ type: "text", text: text.slice(last) });
  return parts;
}

export function parseFaqAnswer(answer: string): FaqBlock[] {
  return answer
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.split("\n").map((line) => line.trim()).filter(Boolean))
    .filter((lines) => lines.length > 0)
    .map((lines): FaqBlock => {
      if (lines.every((line) => ORDERED_LINE.test(line))) {
        return { type: "ordered", items: lines.map((line) => parseInline(line.replace(ORDERED_LINE, ""))) };
      }
      if (lines.every((line) => BULLET_LINE.test(line))) {
        return { type: "bulleted", items: lines.map((line) => parseInline(line.replace(BULLET_LINE, ""))) };
      }
      return { type: "paragraph", lines: lines.map(parseInline) };
    });
}

/**
 * The answer as one plain sentence run, for the FAQPage schema Google reads.
 * Link text is kept, except "Read more →"-style links, which only make sense
 * on the page.
 */
export function faqAnswerPlainText(answer: string) {
  const inlineText = (parts: FaqInline[]) =>
    parts.map((part) => (part.type === "link" && part.text.trim().endsWith("→") ? "" : part.text)).join("");
  return parseFaqAnswer(answer)
    .map((block) => {
      if (block.type === "paragraph") return block.lines.map(inlineText).join(" ");
      const items = block.items.map((item) => inlineText(item).trim().replace(/[.;,]$/, ""));
      return `${items.join(", ")}.`;
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
}

/** What the admin sends when creating or editing a question. */
export const faqInputSchema = z.object({
  section: z.enum(FAQ_SECTION_IDS),
  question: z.string().trim().min(1, "Question is required").max(FAQ_LIMITS.question),
  answer: z.string().trim().min(1, "Answer is required").max(FAQ_LIMITS.answer),
  visible: z.boolean(),
});

export type FaqInput = z.infer<typeof faqInputSchema>;
