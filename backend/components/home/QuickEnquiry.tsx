"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AGE_GROUPS, nameField } from "@shared/schema";
import { Check, MessageCircle } from "lucide-react";

const COUNTRY_CODES = ["+971", "+966", "+974", "+973", "+968", "+965", "+20", "+91", "+92", "+63", "+44", "+1", "+33", "+34", "+7", "+86", "+27", "+61"];

/** A three-field "try a free session" band: name, WhatsApp number and the child's age group. The team replies on WhatsApp. */
export function QuickEnquiry({ heading, text, button }: { heading: string; text: string; button: string }) {
  const router = useRouter();
  const startedAt = useRef(0);
  const hidden = useRef({ utmSource: "", utmMedium: "", utmCampaign: "", landingPage: "", referrer: "" });
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+971");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
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
  }, []);

  function validate() {
    const next: Record<string, string> = {};
    const parsedName = nameField("Your name").safeParse(name);
    if (!parsedName.success) next.name = parsedName.error.issues[0].message;
    const digits = phone.replace(/[\s\-()]/g, "");
    if (!/^\d+$/.test(digits)) next.phone = digits ? "Digits only, please" : "Enter your WhatsApp number";
    else if (countryCode === "+971" ? digits.replace(/^0/, "").length !== 9 : digits.length < 6 || digits.length > 13) next.phone = "Check the number";
    if (!age) next.age = "Choose an age group";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFailed(false);
    if (!validate()) return;
    setSending(true);
    try {
      const res = await fetch("/api/quick-enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentName: name.trim(),
          phone: `${countryCode}${phone.replace(/[\s\-()]/g, "").replace(/^0/, "")}`,
          ageGroup: age,
          ...hidden.current,
          website,
          formStartedAt: startedAt.current,
        }),
      });
      if (!res.ok) throw new Error("failed");
      router.push(`/thank-you?source=${encodeURIComponent(hidden.current.landingPage || window.location.href)}`);
    } catch {
      setFailed(true);
      setSending(false);
    }
  }

  const err = (key: string) => (errors[key] ? <p role="alert" className="mt-1 text-xs font-bold text-red-600">{errors[key]}</p> : null);
  const label = "mb-1.5 block text-[11px] font-extrabold uppercase tracking-widest text-neutral-500";
  const field = "h-12 w-full border border-neutral-200 bg-neutral-50 px-3 text-base text-black transition-colors placeholder:text-neutral-400 focus:border-black focus:bg-white focus:outline-none";

  return (
    <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-14" data-testid="quick-enquiry">
      <div className="text-white">
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.2em] text-black/70">First session on us</p>
        <h2 className="text-4xl font-black uppercase leading-none tracking-tighter md:text-5xl">{heading}</h2>
        <p className="mt-3 max-w-md text-lg text-white/95">{text}</p>
        <ul className="mt-5 grid gap-2 text-sm font-bold">
          {["Free, no commitment", "We reply personally on WhatsApp", "Girls' and boys' groups, ages 4–18"].map((t) => (
            <li key={t} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-black" aria-hidden="true" />{t}</li>
          ))}
        </ul>
      </div>
      <form onSubmit={submit} noValidate className="bg-white p-5 shadow-xl md:p-7">
        <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
          <label htmlFor="quick-website">Website</label>
          <input id="quick-website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        <div className="grid gap-4">
          <div>
            <label htmlFor="quick-name" className={label}>Your name</label>
            <input id="quick-name" type="text" autoComplete="name" placeholder="e.g. Sara Ahmed" value={name} onChange={(e) => setName(e.target.value)} className={field} data-testid="quick-name" />
            {err("name")}
          </div>
          <div>
            <label htmlFor="quick-phone" className={label}>WhatsApp number</label>
            <div className="flex">
              <select aria-label="Country code" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="h-12 w-[84px] shrink-0 border border-r-0 border-neutral-200 bg-neutral-50 px-2 text-base text-black focus:border-black focus:outline-none" data-testid="quick-country">
                {COUNTRY_CODES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input id="quick-phone" type="tel" inputMode="tel" autoComplete="tel-national" placeholder="50 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${field} min-w-0 flex-1`} data-testid="quick-phone" />
            </div>
            {err("phone")}
          </div>
          <fieldset data-testid="quick-age">
            <legend className={label}>Child&apos;s age group</legend>
            <div className="grid grid-cols-3 gap-2">
              {AGE_GROUPS.map((g) => (
                <button key={g} type="button" aria-pressed={age === g} onClick={() => setAge(g)} className={`h-12 border text-sm font-extrabold transition-colors ${age === g ? "border-black bg-black text-white" : "border-neutral-200 bg-neutral-50 text-black hover:border-black"}`}>
                  {g.replace(" years", "")}
                </button>
              ))}
            </div>
            {err("age")}
          </fieldset>
          <button type="submit" disabled={sending} className="flex h-14 items-center justify-center gap-2 bg-black text-sm font-extrabold uppercase tracking-widest text-white transition-colors hover:bg-primary disabled:opacity-60" data-testid="quick-submit">
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            {sending ? "Sending..." : button}
          </button>
          <p className="text-center text-xs text-neutral-500">We only use your number to arrange your session. No spam.</p>
        </div>
        {failed && <p role="alert" className="mt-3 text-sm font-bold text-red-600">Something went wrong. Please try again or message us on WhatsApp.</p>}
      </form>
    </div>
  );
}
