import type { Metadata } from "next";
import ThankYouClient from "./ThankYouClient";
import { buildPageMetadata, getAltResolver } from "@/lib/seo/resolve";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("/thank-you");
}

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string; camp?: string }>;
}) {
  const params = await searchParams;
  const alt = await getAltResolver();
  // A camp sign-up arrives with the camp's name; it is only ever shown as text, so keep it short and plain.
  const camp = (params.camp ?? "").replace(/[<>]/g, "").trim().slice(0, 120);
  return <ThankYouClient source={params.source || "direct"} camp={camp} logoAlt={alt("thank-you.logo")} />;
}
