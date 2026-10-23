import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import "./globals.css";
import { Header, type MenuVehicle } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AssistantLauncher } from "@/components/assistant/launcher";
import { cars, trucks } from "@/lib/content";
import { formatLakh, formatPhone, telHref } from "@/lib/format";
import { siteUrl, primarySalesPhone } from "@/lib/site";
import { navigation } from "@/content/curation";
import { JsonLd, organizationLd } from "@/lib/structured-data";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const archivo = Archivo({ subsets: ["latin"], variable: "--font-archivo", axes: ["wdth"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Shital Motors — Authorised Mahindra Dealer in Ahmedabad, Sanand & Surendranagar",
    template: "%s · Shital Motors",
  },
  description:
    "Explore Mahindra SUVs, electric SUVs and commercial vehicles with ex-showroom prices, book a test drive or a service, and find Shital Motors showrooms and workshops across Ahmedabad, Sanand and Surendranagar.",
  applicationName: "Shital Motors",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Shital Motors",
    url: siteUrl,
  },
  twitter: { card: "summary_large_image", site: "@ShitalMotorsMM" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#f6f6f4",
  colorScheme: "light",
};

const toMenu = (name: string, href: string, price: number | null, thumb: string | null): MenuVehicle => ({
  name,
  href,
  price: formatLakh(price),
  thumb,
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const byPrice = <T extends { startingPrice: number | null }>(a: T, b: T) => (a.startingPrice ?? 0) - (b.startingPrice ?? 0);
  const suvs = cars.filter((c) => c.segment === "suv").sort(byPrice).map((c) => toMenu(c.name, `/cars/${c.slug}`, c.startingPrice, c.thumb?.src ?? c.image.src));
  const electric = cars.filter((c) => c.segment === "electric").sort(byPrice).map((c) => toMenu(c.name, `/cars/${c.slug}`, c.startingPrice, c.thumb?.src ?? c.image.src));
  const commercial = [...trucks].sort(byPrice).map((t) => toMenu(t.name, `/commercial/${t.slug}`, t.startingPrice, t.image.src));

  return (
    <html lang="en-IN" className={`${inter.variable} ${archivo.variable}`}>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only z-50 rounded-full bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        <Header
          suvs={suvs}
          electric={electric}
          commercial={commercial}
          salesPhone={{ display: formatPhone(primarySalesPhone), href: telHref(primarySalesPhone) }}
          links={navigation.primary.filter((l) => l.href !== "/cars")}
          company={navigation.company}
        />
        <main id="main">{children}</main>
        <Footer />
        <AssistantLauncher salesPhone={{ display: formatPhone(primarySalesPhone), href: telHref(primarySalesPhone) }} />
        <JsonLd data={organizationLd()} />
      </body>
    </html>
  );
}
