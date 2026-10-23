import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CalendarCheck, FileDown, Fuel, Gauge, IndianRupee, Ruler, Settings2, Sparkles, Users, Zap, BatteryCharging } from "lucide-react";
import { cars, catalog, getCar, isMedia, shortVariantName, specValues, type Car } from "@/lib/content";
import { formatLakh, formatPriceRange } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Breadcrumbs, SectionHeader } from "@/components/ui/primitives";
import { SectionNav } from "@/components/ui/section-nav";
import { ColourStage } from "@/components/vehicles/colour-stage";
import { VariantTable, type VariantRow } from "@/components/vehicles/variant-table";
import { SpecSheet } from "@/components/vehicles/spec-sheet";
import { LightboxGallery } from "@/components/media/lightbox-gallery";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { AskAssistantButton } from "@/components/assistant/ask-button";
import { breadcrumbLd, carLd, JsonLd } from "@/lib/structured-data";

// Every valid slug is prerendered by generateStaticParams, so navigations are
// already instant. Opting out of instant validation (rather than adding a
// loading.tsx Suspense boundary) keeps unknown slugs returning a real HTTP 404.
export const instant = false;

export function generateStaticParams() {
  return cars.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const car = getCar((await params).slug);
  if (!car) return {};
  const range = formatPriceRange(car.startingPrice, car.topPrice);
  return {
    title: `${car.fullName} Price in Ahmedabad, Variants, Colours & Specs`,
    description: `${car.fullName}: ${car.variants.length} variants, ex-showroom ${range} in Ahmedabad. ${car.fuels.join(" & ")}, ${car.transmissions.join(" & ").toLowerCase()}. Book a test drive or get the on-road price from Shital Motors.`,
    alternates: { canonical: `/cars/${car.slug}` },
    openGraph: { images: [{ url: car.image.src, width: car.image.width ?? 930, height: car.image.height ?? 620, alt: car.fullName }] },
  };
}

/** Collapse "1497", "2184" into "1497 – 2184 cc"; keep single values as-is. */
function span(values: string[], unit = "") {
  const nums = values.map((v) => parseFloat(v)).filter(Number.isFinite);
  if (!nums.length) return null;
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  return lo === hi ? `${lo}${unit}` : `${lo} – ${hi}${unit}`;
}

function atAGlance(car: Car) {
  const items: { icon: typeof Gauge; label: string; value: string }[] = [];
  const range = formatPriceRange(car.startingPrice, car.topPrice);
  if (range) items.push({ icon: IndianRupee, label: "Ex-showroom", value: range });
  // Ignore implausible displacement values (the source lists "1" for some EVs).
  const disp = car.segment === "electric" ? null : span(specValues(car, "Displacement").filter((v) => parseFloat(v) >= 500), " cc");
  if (disp) items.push({ icon: Gauge, label: "Engine", value: disp });
  const battery = span(car.variants.map((v) => v.battery ?? "").filter(Boolean), " kWh");
  if (battery) items.push({ icon: BatteryCharging, label: "Battery", value: battery });
  items.push({ icon: car.segment === "electric" ? Zap : Fuel, label: "Fuel", value: car.fuels.join(" / ") });
  items.push({ icon: Settings2, label: "Transmission", value: car.transmissions.join(" / ") });
  const seats = specValues(car, "Seating Capacity");
  if (seats.length) items.push({ icon: Users, label: "Seating", value: seats.sort().join(" / ") + " seats" });
  const length = span(specValues(car, "Length"), " mm");
  if (length) items.push({ icon: Ruler, label: "Length", value: length });
  return items;
}

export default async function CarPage({ params }: { params: Promise<{ slug: string }> }) {
  const car = getCar((await params).slug);
  if (!car) notFound();

  const colours = car.colors.filter((c) => isMedia(c.image)).map((c) => ({ name: c.name, hex: c.hex, src: c.image!.src }));
  const brochure = car.variants.find((v) => v.brochure)?.brochure ?? null;
  const rows: VariantRow[] = car.variants.map((v) => ({
    name: shortVariantName(car, v.name),
    fuel: v.fuel || null,
    transmission: v.transmission,
    engine: v.engine,
    battery: v.battery,
    power: v.power,
    price: formatLakh(v.price),
    priceValue: v.price,
    brochure: v.brochure,
  }));
  const specs = car.specs.filter((s) => s.groups.length).map((s, i) => ({ name: s.variant ?? shortVariantName(car, car.variants[i]?.name ?? `Variant ${i + 1}`), groups: s.groups }));
  const pictures = car.pictures.filter((p) => isMedia(p.image)).map((p) => ({ src: p.image!.src, alt: `${car.name} — ${p.label}`, caption: p.label })).slice(0, 9); // 1 feature + 8 tiles fills the grid
  const related = cars.filter((c) => c.slug !== car.slug && c.segment === car.segment).sort((a, b) => Math.abs((a.startingPrice ?? 0) - (car.startingPrice ?? 0)) - Math.abs((b.startingPrice ?? 0) - (car.startingPrice ?? 0))).slice(0, 3);

  const sections = [
    { id: "overview", label: "Overview" },
    { id: "variants", label: `Variants & prices` },
    ...(specs.length ? [{ id: "specifications", label: "Specifications" }] : []),
    ...(pictures.length ? [{ id: "gallery", label: "Gallery" }] : []),
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-surface">
        <div className="container-x relative pb-10 pt-8 md:pt-10">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "SUVs", href: "/cars" }, { label: car.name }]} />
          <div className="mt-8 grid items-center gap-10 lg:grid-cols-12 lg:gap-6">
            <div className="lg:col-span-5">
              <div className="flex flex-wrap gap-2">
                {car.segment === "electric" ? (
                  <Badge tone="electric"><Zap aria-hidden className="size-3" /> Electric SUV</Badge>
                ) : (
                  <Badge>SUV</Badge>
                )}
                <Badge>{car.variants.length} variants</Badge>
                {colours.length > 1 && <Badge>{colours.length} colours</Badge>}
              </div>
              <h1 className="display-lg mt-5">
                <span className="block text-[0.42em] font-medium tracking-normal text-muted [font-variation-settings:'wdth'_100]">Mahindra</span>
                {car.name}
              </h1>
              <div className="mt-6">
                <p className="text-sm text-muted">Ex-showroom price, Ahmedabad</p>
                <p className="tabular mt-1 font-display text-3xl font-semibold tracking-tight [font-variation-settings:'wdth'_110]">
                  {formatLakh(car.startingPrice)}
                  {car.topPrice && car.topPrice !== car.startingPrice && <span className="text-xl font-medium text-muted"> – {formatLakh(car.topPrice)}</span>}
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href={`/get-price?model=${car.slug}`} variant="primary" size="lg">Get on-road price</ButtonLink>
                <ButtonLink href={`/test-drive?model=${car.slug}`} variant="secondary" size="lg">
                  <CalendarCheck aria-hidden className="size-4" /> Book a test drive
                </ButtonLink>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                {brochure && (
                  <a href={brochure} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-ink-2 hover:text-ink">
                    <FileDown aria-hidden className="size-4" /> Download brochure (PDF)
                  </a>
                )}
                <AskAssistantButton prompt={`Tell me about the ${car.name} variants and prices`} variant="ghost" className="!h-auto !px-0 text-sm text-ink-2 hover:!bg-transparent hover:text-ink">
                  <Sparkles aria-hidden className="size-4" /> Ask about the {car.name}
                </AskAssistantButton>
              </div>
            </div>
            <div className="lg:col-span-7">
              {colours.length > 1 ? (
                <ColourStage model={car.fullName} colours={colours} />
              ) : (
                <div className="stage relative aspect-[3/2] overflow-hidden rounded-[var(--radius-stage)]">
                  <Image src={car.image.src} alt={car.fullName} fill fetchPriority="high" loading="eager" sizes="(min-width: 1024px) 55vw, 92vw" className="z-[1] object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <SectionNav sections={sections} action={<ButtonLink href={`/test-drive?model=${car.slug}`} variant="dark" size="sm">Test drive</ButtonLink>} />

      <section id="overview" aria-labelledby="overview-title" className="container-x scroll-mt-36 pt-14">
        <h2 id="overview-title" className="sr-only">Overview</h2>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
          {atAGlance(car).slice(0, 6).map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-surface p-5">
              <dt className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
                <Icon aria-hidden className="size-4 text-subtle" /> {label}
              </dt>
              <dd className="tabular mt-2 font-display text-lg font-semibold leading-tight [font-variation-settings:'wdth'_106]">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="variants" aria-labelledby="variants-title" className="container-x scroll-mt-36 pt-20">
        <SectionHeader id="variants-title" eyebrow="Variants & prices" title={`${car.variants.length} ways to own the ${car.name}`} lead={catalog.priceNote} />
        <div className="mt-8">
          <VariantTable rows={rows} modelSlug={car.slug} />
        </div>
      </section>

      {specs.length > 0 && (
        <section id="specifications" aria-labelledby="specs-title" className="container-x scroll-mt-36 pt-20">
          <SectionHeader id="specs-title" eyebrow="Specifications" title="Technical specifications" lead="Choose a variant to see its published specifications." />
          <div className="mt-8">
            <SpecSheet variants={specs} />
          </div>
        </section>
      )}

      {pictures.length > 0 && (
        <section id="gallery" aria-labelledby="gallery-title" className="container-x scroll-mt-36 pt-20">
          <SectionHeader id="gallery-title" eyebrow="Gallery" title={`${car.name} in pictures`} />
          <LightboxGallery className="mt-8" images={pictures} layout="feature" studio />
        </section>
      )}

      <section className="container-x pt-16">
        <p className="max-w-4xl text-xs leading-relaxed text-muted">
          <strong className="font-medium text-ink-2">Disclaimer:</strong> The colour and images of the vehicle shown are only for illustration/representation purpose. The online representation of colour and images might differ based on the quality of screen, lighting, shade, etc. Please visit the dealership to check the actual colour and details of the vehicle. Prices shown are subject to change at any time; kindly contact our nearest showroom for the current price.
        </p>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="container-x pt-20">
          <SectionHeader id="related-title" eyebrow="Keep exploring" title={car.segment === "electric" ? "Other electric SUVs" : "Similar SUVs"} />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((c) => (
              <VehicleCard key={c.slug} kind="car" car={c} />
            ))}
          </div>
        </section>
      )}

      <JsonLd data={carLd(car)} />
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "SUVs", path: "/cars" }, { name: car.name, path: `/cars/${car.slug}` }])} />
    </>
  );
}
