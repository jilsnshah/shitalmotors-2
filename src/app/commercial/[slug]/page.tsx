import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CalendarCheck, Fuel, Gauge, IndianRupee, Weight } from "lucide-react";
import { catalog, getTruck, trucks } from "@/lib/content";
import { formatLakh, formatPriceRange } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Breadcrumbs, SectionHeader } from "@/components/ui/primitives";
import { VariantTable, type VariantRow } from "@/components/vehicles/variant-table";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { breadcrumbLd, JsonLd } from "@/lib/structured-data";

// Every valid slug is prerendered by generateStaticParams, so navigations are
// already instant. Opting out of instant validation (rather than adding a
// loading.tsx Suspense boundary) keeps unknown slugs returning a real HTTP 404.
export const instant = false;

export function generateStaticParams() {
  return trucks.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const t = getTruck((await params).slug);
  if (!t) return {};
  return {
    title: `Mahindra ${t.name} Price in Ahmedabad & Variants`,
    description: `Mahindra ${t.name} (${t.typeLabel.replace(/s$/, "")}): ${t.variants.length} variants${t.startingPrice ? `, ex-showroom from ${formatLakh(t.startingPrice)} in Ahmedabad` : ""}. Get the on-road price from Shital Motors.`,
    alternates: { canonical: `/commercial/${t.slug}` },
    openGraph: { images: [{ url: t.image.src, alt: t.name }] },
  };
}

export default async function TruckPage({ params }: { params: Promise<{ slug: string }> }) {
  const t = getTruck((await params).slug);
  if (!t) notFound();

  const rows: VariantRow[] = t.variants.map((v) => ({
    name: v.name,
    fuel: v.fuel,
    transmission: null,
    engine: null,
    battery: null,
    power: v.power,
    gvw: v.gvw,
    price: formatLakh(v.price),
    priceValue: v.price,
    brochure: null,
  }));
  const gvws = [...new Set(t.variants.map((v) => v.gvw).filter(Boolean))];
  const fuels = [...new Set(t.variants.map((v) => v.fuel).filter(Boolean))];
  const powers = [...new Set(t.variants.map((v) => v.power).filter(Boolean))];
  const glance = [
    { icon: IndianRupee, label: "Ex-showroom", value: formatPriceRange(t.startingPrice, t.topPrice) ?? "On request" },
    { icon: Fuel, label: "Fuel", value: fuels.join(" / ") || "—" },
    { icon: Weight, label: "GVW", value: gvws.length > 1 ? `${gvws[0]} – ${gvws.at(-1)}` : gvws[0] ?? "—" },
    { icon: Gauge, label: "Power", value: powers.length > 1 ? `${powers.length} options` : powers[0] ?? "—" },
  ];
  const related = trucks.filter((x) => x.slug !== t.slug && x.type === t.type).slice(0, 3);

  return (
    <>
      <section className="bg-surface">
        <div className="container-x pb-12 pt-8 md:pt-10">
          <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Commercial", href: "/commercial" }, { label: t.name }]} />
          <div className="mt-8 grid items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="flex gap-2">
                <Badge>{t.typeLabel.replace(/s$/, "")}</Badge>
                <Badge>{t.variants.length} variant{t.variants.length === 1 ? "" : "s"}</Badge>
              </div>
              <h1 className="display-lg mt-5">
                <span className="block text-[0.42em] font-medium tracking-normal text-muted [font-variation-settings:'wdth'_100]">Mahindra</span>
                {t.name}
              </h1>
              <p className="mt-6 text-sm text-muted">Ex-showroom price, Ahmedabad</p>
              <p className="tabular mt-1 font-display text-3xl font-semibold [font-variation-settings:'wdth'_110]">{formatLakh(t.startingPrice) ?? "Price on request"}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href={`/get-price?model=${t.slug}`} variant="primary" size="lg">Get on-road price</ButtonLink>
                <ButtonLink href={`/test-drive?model=${t.slug}`} variant="secondary" size="lg">
                  <CalendarCheck aria-hidden className="size-4" /> Book a test drive
                </ButtonLink>
              </div>
            </div>
            <div className="relative aspect-[3/2] overflow-hidden rounded-[var(--radius-stage)] bg-sunken shadow-lift lg:col-span-7">
              <Image src={t.image.src} alt={`Mahindra ${t.name}`} fill fetchPriority="high" loading="eager" sizes="(min-width: 1024px) 55vw, 92vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section aria-label="At a glance" className="container-x pt-12">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line lg:grid-cols-4">
          {glance.map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-surface p-5">
              <dt className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted">
                <Icon aria-hidden className="size-4 text-subtle" /> {label}
              </dt>
              <dd className="tabular mt-2 font-display text-lg font-semibold [font-variation-settings:'wdth'_106]">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="variants" aria-labelledby="variants-title" className="container-x pt-16">
        <SectionHeader id="variants-title" eyebrow="Variants & prices" title={`${t.name} variants`} lead={`${catalog.priceNote} Variants marked "On request" have no published price — ask our team.`} />
        <div className="mt-8">
          <VariantTable rows={rows} modelSlug={t.slug} kind="truck" />
        </div>
        <p className="mt-6 max-w-4xl text-xs leading-relaxed text-muted">
          The colour and images of the vehicle shown are only for illustration/representation purpose. Please visit the dealership to check actual details of the vehicle.
        </p>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="container-x pt-20">
          <SectionHeader id="related-title" eyebrow="Keep exploring" title={`More ${t.typeLabel.toLowerCase()}`} />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((x) => (
              <VehicleCard key={x.slug} kind="truck" truck={x} />
            ))}
          </div>
        </section>
      )}
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Commercial", path: "/commercial" }, { name: t.name, path: `/commercial/${t.slug}` }])} />
    </>
  );
}
