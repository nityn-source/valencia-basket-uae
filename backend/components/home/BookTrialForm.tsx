"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import {
  AGE_GROUPS,
  AREAS,
  LEVELS,
  HOW_HEARD_OPTIONS,
  nameField,
} from "@shared/schema";

const COUNTRY_CODES = [
  { code: "+971", label: "🇦🇪 +971", digits: 9 },
  { code: "+966", label: "🇸🇦 +966" },
  { code: "+974", label: "🇶🇦 +974" },
  { code: "+973", label: "🇧🇭 +973" },
  { code: "+968", label: "🇴🇲 +968" },
  { code: "+965", label: "🇰🇼 +965" },
  { code: "+20", label: "🇪🇬 +20" },
  { code: "+91", label: "🇮🇳 +91" },
  { code: "+92", label: "🇵🇰 +92" },
  { code: "+63", label: "🇵🇭 +63" },
  { code: "+44", label: "🇬🇧 +44" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+33", label: "🇫🇷 +33" },
  { code: "+34", label: "🇪🇸 +34" },
  { code: "+7", label: "🇷🇺 +7" },
  { code: "+86", label: "🇨🇳 +86" },
  { code: "+27", label: "🇿🇦 +27" },
  { code: "+61", label: "🇦🇺 +61" },
] as const;

const EMAIL_TYPO_DOMAINS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmail.co": "gmail.com",
};

const clientSchema = z
  .object({
    parentName: nameField("Parent/Guardian name"),
    playerName: nameField("Child's name"),
    ageGroup: z.string().min(1, "Please select an age group"),
    area: z.string().min(1, "Please select your area"),
    level: z.string().optional(),
    email: z.string().trim().email("Please enter a valid email address"),
    countryCode: z.string().min(1),
    phoneNumber: z.string().min(1, "Phone number is required"),
    whatsapp: z.boolean().default(false),
    howHeard: z.string().min(1, "Please tell us how you heard about us"),
    notes: z.string().max(500, "Notes must be 500 characters or fewer").optional(),
    website: z.string().optional(), // honeypot
  })
  .superRefine((data, ctx) => {
    const digits = data.phoneNumber.replace(/[\s\-()]/g, "");
    if (!/^\d+$/.test(digits)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phoneNumber"], message: "Phone number can only contain digits" });
      return;
    }
    if (data.countryCode === "+971") {
      const normalized = digits.replace(/^0/, "");
      if (normalized.length !== 9) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phoneNumber"], message: "Please enter a valid UAE phone number (9 digits after +971)" });
      }
    } else if (digits.length < 6 || digits.length > 13) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phoneNumber"], message: "Please enter a valid phone number" });
    }
  });

type FormValues = z.infer<typeof clientSchema>;

function RequiredMark() {
  return <span className="text-red-600 ml-0.5" aria-hidden="true">*</span>;
}

const labelClass = "uppercase text-xs font-bold tracking-wider";
const inputClass = "rounded-none border-gray-300 focus:border-primary";
const selectClass = "rounded-none border-gray-300 focus:ring-primary";

export function BookTrialForm({
  sourcePage = "home",
  heading = "Book Your Free Trial",
  subheading = "Experience the Valencia Basket methodology firsthand.",
  submitLabel = "Submit Request",
}: {
  sourcePage?: string;
  heading?: string;
  subheading?: string;
  submitLabel?: string;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const startedAtRef = useRef<number>(0);
  const hiddenRef = useRef({ utmSource: "", utmMedium: "", utmCampaign: "", landingPage: "", referrer: "" });

  useEffect(() => {
    startedAtRef.current = Date.now();
    const params = new URLSearchParams(window.location.search);
    hiddenRef.current = {
      utmSource: params.get("utm_source") || "direct",
      utmMedium: params.get("utm_medium") || "direct",
      utmCampaign: params.get("utm_campaign") || "direct",
      landingPage: window.location.href,
      referrer: document.referrer || "",
    };
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(clientSchema),
    mode: "onBlur",
    defaultValues: {
      parentName: "",
      playerName: "",
      ageGroup: "",
      area: "",
      level: "",
      email: "",
      countryCode: "+971",
      phoneNumber: "",
      whatsapp: false,
      howHeard: "",
      notes: "",
      website: "",
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const digits = values.phoneNumber.replace(/[\s\-()]/g, "").replace(/^0/, "");
      const response = await fetch("/api/trial-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentName: values.parentName.trim(),
          playerName: values.playerName.trim(),
          ageGroup: values.ageGroup,
          area: values.area,
          programInterest: values.level || "",
          email: values.email.trim().toLowerCase(),
          phone: `${values.countryCode}${digits}`,
          whatsapp: values.whatsapp,
          howHeard: values.howHeard,
          additionalInfo: values.notes || "",
          ...hiddenRef.current,
          sourcePage,
          website: values.website || "",
          formStartedAt: startedAtRef.current,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit booking");
      }

      return response.json();
    },
    onSuccess: (_data, _values) => {
      const originUrl = hiddenRef.current.landingPage || window.location.href;
      router.push(`/thank-you?source=${encodeURIComponent(originUrl)}`);
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  function checkEmailTypo(value: string) {
    const domain = value.split("@")[1]?.toLowerCase();
    if (domain && EMAIL_TYPO_DOMAINS[domain]) {
      setEmailSuggestion(value.replace(new RegExp(`${domain}$`, "i"), EMAIL_TYPO_DOMAINS[domain]));
    } else {
      setEmailSuggestion(null);
    }
  }

  function onSubmit(values: FormValues) {
    createBookingMutation.mutate(values);
  }

  return (
    <div className="bg-white p-8 md:p-12 shadow-2xl border-t-4 border-primary">
      <div className="mb-8">
        <h3 className="text-2xl font-black uppercase mb-2">{heading}</h3>
        <p className="text-gray-500 text-sm">{subheading}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {/* Honeypot — hidden from real users */}
          <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
            <label htmlFor="website-field">Website</label>
            <input
              id="website-field"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              {...form.register("website")}
            />
          </div>

          <FormField
            control={form.control}
            name="parentName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>Parent/Guardian Name<RequiredMark /></FormLabel>
                <FormControl>
                  <Input placeholder="Jane Doe" className={inputClass} data-testid="input-parent-name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="playerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Child&apos;s Name<RequiredMark /></FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" className={inputClass} data-testid="input-child-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ageGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Child&apos;s Age Group<RequiredMark /></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={selectClass} data-testid="select-age-group">
                        <SelectValue placeholder="Select age group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AGE_GROUPS.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Area/Locality<RequiredMark /></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={selectClass} data-testid="select-area">
                        <SelectValue placeholder="Select area" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[260px] overflow-y-auto">
                      {AREAS.map((a) => (
                        <SelectItem key={a} value={a}>{a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Current Level</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={selectClass} data-testid="select-level">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {LEVELS.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6 pt-4 border-t border-gray-100">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>Email<RequiredMark /></FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="parent@example.com"
                      className={inputClass}
                      data-testid="input-email"
                      {...field}
                      onBlur={(e) => {
                        field.onBlur();
                        checkEmailTypo(e.target.value);
                      }}
                    />
                  </FormControl>
                  {emailSuggestion && (
                    <button
                      type="button"
                      className="text-xs text-primary underline text-left"
                      data-testid="button-email-suggestion"
                      onClick={() => {
                        form.setValue("email", emailSuggestion, { shouldValidate: true });
                        setEmailSuggestion(null);
                      }}
                    >
                      Did you mean {emailSuggestion}?
                    </button>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelClass}>Phone<RequiredMark /></FormLabel>
                    <div className="flex gap-2">
                      <FormField
                        control={form.control}
                        name="countryCode"
                        render={({ field: ccField }) => (
                          <Select onValueChange={ccField.onChange} value={ccField.value}>
                            <SelectTrigger className={`${selectClass} w-[110px] shrink-0`} data-testid="select-country-code" aria-label="Country code">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-[240px] overflow-y-auto [scrollbar-width:thin]">
                              {COUNTRY_CODES.map((c) => (
                                <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      <FormControl>
                        <Input
                          type="tel"
                          inputMode="tel"
                          placeholder="50 000 0000"
                          className={`${inputClass} flex-1`}
                          data-testid="input-phone"
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0 mt-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-whatsapp"
                        id="whatsapp-checkbox"
                      />
                    </FormControl>
                    <FormLabel htmlFor="whatsapp-checkbox" className="text-sm font-normal text-gray-600 cursor-pointer">
                      This number is on WhatsApp
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="howHeard"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelClass}>How did you hear about us?<RequiredMark /></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={selectClass} data-testid="select-how-heard">
                        <SelectValue placeholder="Please select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {HOW_HEARD_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={labelClass}>Notes / Preferred Days</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any specific requirements or preferred timing?"
                    className={inputClass}
                    maxLength={500}
                    data-testid="input-notes"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            size="lg"
            className="w-full uppercase font-bold tracking-wider rounded-none bg-black hover:bg-primary text-white transition-colors h-14 disabled:opacity-60"
            disabled={createBookingMutation.isPending}
            data-testid="button-submit-trial"
          >
            {createBookingMutation.isPending ? "Submitting..." : submitLabel}
          </Button>
        </form>
      </Form>
    </div>
  );
}
