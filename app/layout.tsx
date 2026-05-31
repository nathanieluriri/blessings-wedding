import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Fraunces } from "next/font/google";
import "./globals.css";
import SmoothScroll from "./components/SmoothScroll";
import { getWeddingDate, formatLongDate, formatYear } from "@/lib/settings";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

// Editorial serif used by the opening sequence (counter / %).
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://ofodimma.com";

const TITLE = "Blessing & Justice — A Wedding Invitation | #OfoDiMma";

export async function generateMetadata(): Promise<Metadata> {
  const weddingDate = await getWeddingDate();
  const longDate = formatLongDate(weddingDate);
  const weddingYear = formatYear(weddingDate);
  const description = `Join us at Acropolis Park, Apo on ${longDate} as Blessing & Justice say “I do.” A celebration of love, colour, and Igbo heritage. #OfoDiMma`;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: TITLE,
      template: "%s · #OfoDiMma — Blessing & Justice",
    },
    description,
    applicationName: "Blessing & Justice — #OfoDiMma",
    authors: [{ name: "Blessing & Justice" }],
    creator: "Blessing & Justice",
    publisher: "Blessing & Justice",
    keywords: [
      "Blessing and Justice wedding",
      "OfoDiMma",
      "#OfoDiMma",
      "Ofokansi",
      "Mmayen",
      `Nigerian wedding ${weddingYear}`,
      "Igbo wedding",
      "Acropolis Park Apo",
      "Abuja wedding",
      "wedding invitation",
      longDate,
      "rainbow palette wedding",
    ],
    category: "wedding",
    classification: "Wedding Invitation",
    referrer: "origin-when-cross-origin",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: "en_NG",
      url: SITE_URL,
      siteName: "Blessing & Justice — #OfoDiMma",
      title: TITLE,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: "Blessing & Justice — #OfoDiMma",
      description: `${longDate} · Acropolis Park, Apo. Join us as we celebrate. #OfoDiMma`,
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    other: {
      "theme-color": "#5a1a1a",
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf6f0" },
    { media: "(prefers-color-scheme: dark)", color: "#5a1a1a" },
  ],
  colorScheme: "light",
};

function buildEventJsonLd(weddingDate: Date, description: string) {
  const start = weddingDate;
  const addHours = (h: number) =>
    new Date(start.getTime() + h * 3_600_000).toISOString();
  // Reception runs to roughly midnight (~9.5h after the ceremony begins).
  const end = addHours(9.5);
  // Invitations are valid from the start of the wedding year, derived from the
  // backend date so it tracks any change rather than being a stray literal.
  const weddingYear = formatYear(weddingDate);

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: "Blessing & Justice's Wedding — #OfoDiMma",
    description,
    startDate: start.toISOString(),
    endDate: end,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: SITE_URL,
    image: [`${SITE_URL}/opengraph-image`],
    location: {
      "@type": "Place",
      name: "Acropolis Park",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Apo",
        addressRegion: "FCT",
        addressCountry: "NG",
      },
    },
    organizer: [
      { "@type": "Person", name: "Blessing Mmayen" },
      { "@type": "Person", name: "Justice Ofokansi" },
    ],
    performer: [
      { "@type": "Person", name: "Blessing Mmayen" },
      { "@type": "Person", name: "Justice Ofokansi" },
    ],
    subEvent: [
      { "@type": "Event", name: "We Do — Ceremony", startDate: addHours(0) },
      { "@type": "Event", name: "We Drink — Cocktails", startDate: addHours(1.5) },
      { "@type": "Event", name: "We Eat — Dinner", startDate: addHours(2.5) },
      { "@type": "Event", name: "We Party — Reception", startDate: addHours(5.5) },
    ],
    inLanguage: "en",
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      url: SITE_URL,
      price: "0",
      priceCurrency: "NGN",
      availability: "https://schema.org/InviteOnly",
      validFrom: `${weddingYear}-01-01T00:00:00+01:00`,
    },
  } as const;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const weddingDate = await getWeddingDate();
  const longDate = formatLongDate(weddingDate);
  const description = `Join us at Acropolis Park, Apo on ${longDate} as Blessing & Justice say “I do.” A celebration of love, colour, and Igbo heritage. #OfoDiMma`;

  const eventJsonLd = buildEventJsonLd(weddingDate, description);
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Blessing & Justice — #OfoDiMma",
    url: SITE_URL,
    inLanguage: "en",
    description,
  } as const;

  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${fraunces.variable} antialiased`}
    >
      <body className="bg-white text-gray-900" suppressHydrationWarning>
        <SmoothScroll>{children}</SmoothScroll>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </body>
    </html>
  );
}
