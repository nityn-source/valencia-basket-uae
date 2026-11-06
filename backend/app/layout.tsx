import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/toaster";
import { WhatsAppFloat } from "@/components/shared/WhatsAppFloat";
import { Providers } from "./providers";
import { getAltResolver } from "@/lib/seo/resolve";
import { getSitewideStructuredData } from "@/lib/seo/structuredDataResolve";
import { StructuredData } from "@/components/seo/StructuredData";

const PRODUCTION_HOSTS = new Set(["valenciabasket.ae", "www.valenciabasket.ae"]);

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://valenciabasket.ae"),
  title: {
    default: "Valencia Basket UAE | Elite Spanish Basketball Academy",
    template: "%s | Valencia Basket UAE",
  },
  description:
    "The official Valencia Basket Academy in the UAE. Elite Spanish basketball methodology, player development, and professional pathways for youth in Dubai.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Valencia Basket UAE | Elite Spanish Basketball Academy",
    description:
      "Elite Spanish basketball methodology brought to the UAE. Join the legacy of excellence.",
    type: "website",
    siteName: "Valencia Basket UAE",
    url: "https://valenciabasket.ae",
  },
  twitter: {
    card: "summary_large_image",
    site: "@valenciabasketuae",
    title: "Valencia Basket UAE",
    description:
      "Elite Spanish basketball methodology brought to the UAE.",
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const host = (headersList.get("host") ?? "").replace(/:\d+$/, ""); // strip port
  const isProduction = PRODUCTION_HOSTS.has(host);
  const alt = await getAltResolver();
  const siteSchemas = await getSitewideStructuredData();

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Google Tag Manager — production only */}
        {isProduction && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WRL3KPHD');`,
            }}
          />
        )}
        {/* End Google Tag Manager */}
      </head>
      <body className={inter.className}>
        <StructuredData data={siteSchemas} />
        {/* Google Tag Manager (noscript) — production only */}
        {isProduction && (
          <noscript>
            <iframe
              src="https://www.googletagmanager.com/ns.html?id=GTM-WRL3KPHD"
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            ></iframe>
          </noscript>
        )}
        {/* End Google Tag Manager (noscript) */}
        <Providers>
          <div className="min-h-screen bg-background font-sans antialiased flex flex-col">
            <Navbar logoAlt={alt("site.logo")} />
            {/* overflow-x-clip: photo reveals scale images past the screen edge, which must not let the page pan sideways on phones */}
            <main className="flex-grow overflow-x-clip" style={{ paddingTop: "var(--navbar-height, 72px)" }}>{children}</main>
            <Footer logoAlt={alt("site.logo")} />
            <WhatsAppFloat />
            <Toaster />
          </div>
        </Providers>
      </body>
    </html>
  );
}
