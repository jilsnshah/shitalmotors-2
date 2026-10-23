/**
 * Typed access to the content synced from the dealership's current website.
 * Source JSON lives in src/content/generated and is regenerated with
 * `npm run content:sync`. Nothing in here invents facts — editorial choices
 * (ordering, highlights, captions) live in src/content/curation.ts.
 */
import catalogJson from "@/content/generated/catalog.json";
import dealerJson from "@/content/generated/dealer.json";

export type Media = { src: string; source: string; width: number | null; height: number | null };

export type CarVariant = {
  name: string;
  fuel: string;
  transmission: string | null;
  engine: string | null;
  power: string | null;
  battery: string | null;
  range: string | null;
  price: number | null;
  brochure: string | null;
};

export type SpecGroup = { title: string; items: { label: string; value: string }[] };
export type VariantSpec = { variantId: string | null; variant: string | null; groups: SpecGroup[] };

export type Car = {
  slug: string;
  sourceUrl: string;
  name: string;
  fullName: string;
  segment: "suv" | "electric";
  startingPrice: number | null;
  topPrice: number | null;
  fuels: string[];
  transmissions: string[];
  image: Media;
  thumb: Media | null;
  colors: { name: string; hex: string; image: Media | null }[];
  pictures: { label: string; image: Media | null }[];
  variants: CarVariant[];
  specs: VariantSpec[];
};

export type TruckVariant = {
  name: string;
  fuel: string | null;
  power: string | null;
  wheelbase: string | null;
  gvw: string | null;
  price: number | null;
};

export type Truck = {
  slug: string;
  sourceUrl: string;
  name: string;
  type: "pickup" | "scv";
  typeLabel: string;
  startingPrice: number | null;
  topPrice: number | null;
  image: Media;
  variants: TruckVariant[];
};

export type OutletHours = { day: string; hours: string };
export type Outlet = {
  id: string;
  kind: "showroom" | "workshop";
  name: string;
  area: string;
  city: string;
  address: string;
  pincode: string | null;
  phones: string[];
  email: string | null;
  geo: { lat: number; lng: number } | null;
  hours: OutletHours[];
  sourceUrl: string;
};

export type Testimonial = { name: string; city: string; text: string };
export type Video = { id: string; title: string; category?: string | null; thumb: Media | null };
export type LegalBlock = { kind: "heading" | "para" | "item"; text: string };

type Catalog = {
  generatedAt: string;
  priceNote: string;
  cars: Car[];
  trucks: Truck[];
  formModels: { id: string; name: string }[];
  serviceModels: string[];
};

type Dealer = {
  generatedAt: string;
  name: string;
  tagline: string;
  since: string | null;
  about: string;
  aboutImage: Media | null;
  url: string;
  contact: {
    salesPhones: string[];
    servicePhones: string[];
    serviceBookingPhone: string | null;
    email: string | null;
    workshopEmail: string | null;
    hours: string | null;
  };
  socials: Record<"facebook" | "instagram" | "x" | "linkedin", string | null>;
  ownership: { rsa: string | null; shield: string | null };
  appLinks: { android: string | null; ios: string | null; whatsapp: string | null };
  heroBanners: { alt: string; image: Media | null }[];
  outlets: Outlet[];
  testimonials: Testimonial[];
  gallery: { id: string; title: string; images: (Media | null)[] }[];
  videos: Video[];
  service: {
    intro: string[];
    offerings: { title: string; text: string }[];
    videos: Video[];
    walkaround: string | null;
    walkaroundThumb: Media | null;
    gallery: (Media | null)[];
    workshopPhotos: (Media | null)[];
    serviceTypes: string[];
  };
  legal: Record<"privacy" | "terms" | "disclaimer", { title: string; sourceUrl: string; blocks: LegalBlock[] }>;
};

export const catalog = catalogJson as unknown as Catalog;
export const dealer = dealerJson as unknown as Dealer;

export const cars = catalog.cars;
export const trucks = catalog.trucks;
export const outlets = dealer.outlets;
export const showrooms = outlets.filter((o) => o.kind === "showroom");
export const workshops = outlets.filter((o) => o.kind === "workshop");

export const getCar = (slug: string) => cars.find((c) => c.slug === slug);
export const getTruck = (slug: string) => trucks.find((t) => t.slug === slug);

export const isMedia = (m: Media | null | undefined): m is Media => Boolean(m?.src);

/** Spec value lookup for the first (base) variant, by label. */
export function baseSpec(car: Car, label: string): string | null {
  for (const g of car.specs[0]?.groups ?? []) {
    const hit = g.items.find((i) => i.label.toLowerCase() === label.toLowerCase());
    if (hit) return hit.value;
  }
  return null;
}

/** Every distinct value a spec takes across variants (e.g. seating "5" and "7"). */
export function specValues(car: Car, label: string): string[] {
  const values = new Set<string>();
  for (const s of car.specs)
    for (const g of s.groups)
      for (const i of g.items) if (i.label.toLowerCase() === label.toLowerCase()) values.add(i.value);
  return [...values];
}

/** Variant names on the source carry the model prefix; strip it for compact UI. */
export function shortVariantName(car: { fullName?: string; name: string }, variant: string) {
  return variant.replace(car.fullName ?? "", "").replace(car.name, "").trim() || variant;
}

export const allVehicles = [
  ...cars.map((c) => ({ kind: "car" as const, slug: c.slug, name: c.name, href: `/cars/${c.slug}`, startingPrice: c.startingPrice, image: c.image, group: c.segment === "electric" ? "Electric SUVs" : "SUVs" })),
  ...trucks.map((t) => ({ kind: "truck" as const, slug: t.slug, name: t.name, href: `/commercial/${t.slug}`, startingPrice: t.startingPrice, image: t.image, group: t.typeLabel })),
];
