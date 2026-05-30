import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Fraunces } from "next/font/google";
import "./globals.css";
import SmoothScroll from "./components/SmoothScroll";

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
const DESCRIPTION =
  "Join us at Acropolis Park, Apo on 19 December 2026 as Blessing & Justice say “I do.” A celebration of love, colour, and Igbo heritage. #OfoDiMma";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · #OfoDiMma — Blessing & Justice",
  },
  description: DESCRIPTION,
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
    "Nigerian wedding 2026",
    "Igbo wedding",
    "Acropolis Park Apo",
    "Abuja wedding",
    "wedding invitation",
    "19 December 2026",
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
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Blessing & Justice — #OfoDiMma",
    description:
      "19 December 2026 · Acropolis Park, Apo. Join us as we celebrate. #OfoDiMma",
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

const eventJsonLd = {
  "@context": "https://schema.org",
  "@type": "Event",
  name: "Blessing & Justice's Wedding — #OfoDiMma",
  description: DESCRIPTION,
  startDate: "2026-12-19T14:30:00+01:00",
  endDate: "2026-12-20T00:00:00+01:00",
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
    {
      "@type": "Person",
      name: "Blessing Mmayen",
    },
    {
      "@type": "Person",
      name: "Justice Ofokansi",
    },
  ],
  performer: [
    { "@type": "Person", name: "Blessing Mmayen" },
    { "@type": "Person", name: "Justice Ofokansi" },
  ],
  subEvent: [
    {
      "@type": "Event",
      name: "We Do — Ceremony",
      startDate: "2026-12-19T14:30:00+01:00",
    },
    {
      "@type": "Event",
      name: "We Drink — Cocktails",
      startDate: "2026-12-19T16:00:00+01:00",
    },
    {
      "@type": "Event",
      name: "We Eat — Dinner",
      startDate: "2026-12-19T17:00:00+01:00",
    },
    {
      "@type": "Event",
      name: "We Party — Reception",
      startDate: "2026-12-19T20:00:00+01:00",
    },
  ],
  inLanguage: "en",
  isAccessibleForFree: true,
  offers: {
    "@type": "Offer",
    url: SITE_URL,
    price: "0",
    priceCurrency: "NGN",
    availability: "https://schema.org/InviteOnly",
    validFrom: "2026-01-01T00:00:00+01:00",
  },
} as const;

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Blessing & Justice — #OfoDiMma",
  url: SITE_URL,
  inLanguage: "en",
  description: DESCRIPTION,
} as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
