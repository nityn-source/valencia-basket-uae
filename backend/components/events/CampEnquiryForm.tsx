"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CAMP_GENDERS, nameField } from "@shared/schema";
import { WhatsAppIcon } from "@/components/shared/WhatsAppIcon";
import { CAMP_PICK_EVENT } from "@/lib/campPick";
import { trackCampEvent } from "@/lib/campTrack";

export interface CampChoice {
  id: string;
  /** Short chip title, e.g. "Week 1". */
  title: string;
  /** Small line under it, e.g. "Skill Lab". */
  sub: string;
  /** Date range, shown as a third line so the options can be compared, e.g. "7th - 11th Dec". */
  dates: string;
  /** Full wording saved with the lead and used in the WhatsApp message. */
  label: string;
}

interface Props {
  slug: string;
  eventTitle: string;
  heading: string;
  choices: CampChoice[];
  ages: number[];
  whatsappUrl: string;
}

const COUNTRY_CODES = ["+971", "+966", "+974", "+973", "+968", "+965", "+20", "+91", "+92", "+63", "+44", "+1", "+33", "+34", "+7", "+86", "+27", "+61"];

const labelClass = "mb-1.5 block text-xs font-bold uppercase tracking-wider";
const fieldClass = "rounded-none border-gray-300 focus:border-primary";

/**
 * The short camp registration form: which camp, the child's name, age and boy/girl, parent name, email and
 * phone. Everything on one screen; a WhatsApp button below opens a chat with the camp already written in.
 */
export function CampEnquiryForm({ slug, eventTitle, heading, choices, ages, whatsappUrl }: Props) {
  const router = useRouter();
  const startedAt = useRef(0);
  const hidden = useRef({ utmSource: "", utmMedium: "", utmCampaign: "", landingPage: "", referrer: "" });
  const [camp, setCamp] = useState(choices[0]?.id ?? "");
  const [flash, setFlash] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+971");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsapp, setWhatsapp] = useState(true);
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    startedAt.current = Date.now();
    const params = new URLSearchParams(window.location.search);
    hidden.current = {
      utmSource: params.get("utm_source") || "direct",
      utmMedium: params.get("utm_medium") || "direct",
      utmCampaign: params.get("utm_campaign") || "direct",
      landingPage: window.location.href,
      referrer: document.referrer || "",
    };
    // The Register buttons on the camp cards pick the matching chip.
    const onPick = (e: Event) => {
      const id = (e as CustomEvent<string>).detail;
      if (!choices.some((c) => c.id === id)) return;
      setCamp(id);
      // The form is usually still scrolling into view, so the highlight waits for it.
      window.setTimeout(() => setFlash(id), 450);
      window.setTimeout(() => setFlash((cur) => (cur === id ? null : cur)), 2100);
    };
    window.addEventListener(CAMP_PICK_EVENT, onPick);
    return () => window.removeEventListener(CAMP_PICK_EVENT, onPick);
  }, [choices]);

  const chosen = choices.find((c) => c.id === camp);

  function validate() {
    const next: Record<string, string> = {};
    const name = nameField("Child's name").safeParse(playerName);
    if (!name.success) next.playerName = name.error.issues[0].message;
    if (!age) next.age = "Please select your child's age";
    if (!gender) next.gender = "Please choose Girl or Boy";
    const parent = nameField("Parent/Guardian name").safeParse(parentName);
    if (!parent.success) next.parentName = parent.error.issues[0].message;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) next.email = "Please enter a valid email address";
    const digits = phoneNumber.replace(/[\s\-()]/g, "");
    if (!/^\d+$/.test(digits)) next.phone = digits ? "Phone number can only contain digits" : "Phone number is required";
    else if (countryCode === "+971" ? digits.replace(/^0/, "").length !== 9 : digits.length < 6 || digits.length > 13) {
      next.phone = countryCode === "+971" ? "Please enter a valid UAE phone number (9 digits after +971)" : "Please enter a valid phone number";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFailed(false);
    if (!validate() || !chosen) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/camp-enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          camp: chosen.label,
          playerName: playerName.trim(),
          playerAge: Number(age),
          gender,
          parentName: parentName.trim(),
          email: email.trim().toLowerCase(),
          phone: `${countryCode}${phoneNumber.replace(/[\s\-()]/g, "").replace(/^0/, "")}`,
          whatsapp,
          ...hidden.current,
          sourcePage: `camp-${slug}`,
          website,
          formStartedAt: startedAt.current,
        }),
      });
      if (!res.ok) throw new Error("failed");
      // The sign-up itself is counted on the thank-you page, so a refresh or a back button can't count it twice.
      router.push(`/thank-you?source=${encodeURIComponent(hidden.current.landingPage || window.location.href)}&camp=${encodeURIComponent(chosen.label)}`);
    } catch {
      setFailed(true);
      setSubmitting(false);
    }
  }

  const waLink = (() => {
    const message = `Hi, I'd like to register for ${chosen?.label ?? eventTitle} (${eventTitle}).`;
    try {
      const url = new URL(whatsappUrl);
      url.searchParams.set("text", message);
      return url.toString();
    } catch {
      return whatsappUrl;
    }
  })();

  const err = (key: string) =>
    errors[key] ? (
      <p role="alert" className="mt-1 text-xs font-medium text-red-600">
        {errors[key]}
      </p>
    ) : null;

  return (
    <div className={`scroll-mt-24 border-t-4 border-primary bg-white p-6 shadow-2xl transition-shadow duration-500 md:p-10 ${flash ? "shadow-[0_0_0_4px_rgba(255,108,14,0.3),0_25px_50px_-12px_rgba(0,0,0,0.25)]" : ""}`} data-testid="camp-enquiry-form">
      <h3 className="mb-1 text-2xl font-black uppercase">{heading}</h3>
      <p className="mb-6 text-sm text-gray-500">A few quick details and we will confirm your spot and payment on WhatsApp or email.</p>

      <form onSubmit={submit} noValidate className="space-y-5">
        <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
          <label htmlFor="camp-website">Website</label>
          <input id="camp-website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>

        <fieldset>
          <legend className={labelClass}>Which camp</legend>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(choices.length, 3)}, minmax(0, 1fr))` }} role="radiogroup" aria-label="Which camp">
            {choices.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={camp === c.id}
                onClick={() => setCamp(c.id)}
                data-testid={`chip-camp-${c.id}`}
                className={`border-2 px-1 py-3 text-center text-sm font-extrabold leading-tight transition-colors sm:px-2 ${flash === c.id ? "camp-chip-pop " : ""}${camp === c.id ? "border-primary bg-primary text-white" : "border-black bg-white text-black hover:border-primary"}`}
              >
                {c.title}
                {c.sub && <span className={`mt-0.5 block whitespace-nowrap text-[11px] font-semibold ${camp === c.id ? "text-white" : "text-gray-500"}`}>{c.sub}</span>}
                {c.dates && <span className={`mt-1 block whitespace-nowrap text-[10px] font-bold sm:text-[11px] ${camp === c.id ? "text-white" : "text-primary"}`}>{c.dates}</span>}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_120px]">
          <div>
            <label htmlFor="camp-child" className={labelClass}>Child&apos;s name<span className="ml-0.5 text-red-600" aria-hidden="true">*</span></label>
            <Input id="camp-child" placeholder="John Doe" className={fieldClass} value={playerName} onChange={(e) => setPlayerName(e.target.value)} data-testid="input-camp-child" />
            {err("playerName")}
          </div>
          <div>
            <label className={labelClass}>Age<span className="ml-0.5 text-red-600" aria-hidden="true">*</span></label>
            <Select value={age} onValueChange={setAge}>
              <SelectTrigger className="rounded-none border-gray-300" data-testid="select-camp-age" aria-label="Child's age">
                <SelectValue placeholder="Age" />
              </SelectTrigger>
              <SelectContent className="max-h-[240px] overflow-y-auto">
                {ages.map((a) => (
                  <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {err("age")}
          </div>
        </div>

        <fieldset>
          <legend className={labelClass}>Girl or boy<span className="ml-0.5 text-red-600" aria-hidden="true">*</span></legend>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Girl or boy">
            {CAMP_GENDERS.map((g) => (
              <button
                key={g}
                type="button"
                role="radio"
                aria-checked={gender === g}
                onClick={() => setGender(g)}
                data-testid={`chip-gender-${g.toLowerCase()}`}
                className={`border-2 py-2.5 text-sm font-extrabold transition-colors ${gender === g ? "border-primary bg-primary text-white" : "border-black bg-white text-black hover:border-primary"}`}
              >
                {g}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500">Girls and boys train in separate groups.</p>
          {err("gender")}
        </fieldset>

        <div>
          <label htmlFor="camp-parent" className={labelClass}>Parent/guardian name<span className="ml-0.5 text-red-600" aria-hidden="true">*</span></label>
          <Input id="camp-parent" placeholder="Jane Doe" className={fieldClass} value={parentName} onChange={(e) => setParentName(e.target.value)} data-testid="input-camp-parent" />
          {err("parentName")}
        </div>

        <div>
          <label htmlFor="camp-email" className={labelClass}>Email<span className="ml-0.5 text-red-600" aria-hidden="true">*</span></label>
          <Input id="camp-email" type="email" placeholder="parent@example.com" className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-camp-email" />
          {err("email")}
        </div>

        <div>
          <label htmlFor="camp-phone" className={labelClass}>WhatsApp / phone<span className="ml-0.5 text-red-600" aria-hidden="true">*</span></label>
          <div className="flex gap-2">
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger className="w-[100px] shrink-0 rounded-none border-gray-300" aria-label="Country code" data-testid="select-camp-country">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[240px] overflow-y-auto">
                {COUNTRY_CODES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input id="camp-phone" type="tel" inputMode="tel" placeholder="50 000 0000" className={`${fieldClass} flex-1`} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} data-testid="input-camp-phone" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <Checkbox id="camp-whatsapp" checked={whatsapp} onCheckedChange={(v) => setWhatsapp(v === true)} />
            <label htmlFor="camp-whatsapp" className="cursor-pointer text-sm text-gray-600">This number is on WhatsApp</label>
          </div>
          {err("phone")}
        </div>

        {failed && <p role="alert" className="text-sm font-bold text-red-600">Something went wrong. Please try again, or use the WhatsApp button below.</p>}

        <button
          type="submit"
          disabled={submitting}
          data-testid="button-camp-submit"
          className="h-14 w-full bg-black text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-primary disabled:opacity-60"
        >
          {submitting ? "Sending..." : "Reserve my spot"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-[11px] font-bold tracking-[0.16em] text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />OR<span className="h-px flex-1 bg-gray-200" />
      </div>
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => chosen && trackCampEvent("camp_whatsapp_click", chosen.label)}
        data-testid="link-camp-whatsapp"
        className="flex h-14 items-center justify-center gap-2.5 bg-[#25D366] text-sm font-extrabold uppercase tracking-wider text-[#073b1b] transition-opacity hover:opacity-90"
      >
        <WhatsAppIcon className="h-5 w-5" />
        Register on WhatsApp
      </a>
      <p className="mt-2 text-center text-xs text-gray-500">Opens a chat with your camp already written in.</p>
    </div>
  );
}
