import type { Metadata } from "next";
import { catalog, trucks } from "@/lib/content";
import { formatLakh } from "@/lib/format";
import { PageHero, SectionHeader } from "@/components/ui/primitives";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { ButtonLink } from "@/components/ui/button";
import { breadcrumbLd, JsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Mahindra Pick-Ups & Small Commercial Vehicles — Prices",
  description: `Mahindra pick-ups and small commercial vehicles at Shital Motors, from ${formatLakh(Math.min(...trucks.map((t) => t.startingPrice ?? Infinity)))} ex-showroom, Ahmedabad. Supro, Veero, Bolero Pik-Up, Bolero Camper and more.`,
  alternates: { canonical: "/commercial" },
};

export default function CommercialPage() {
  const groups = [...new Set(trucks.map((t) => t.typeLabel))].map((label) => ({
    label,
    items: trucks.filter((t) => t.typeLabel === label).sort((a, b) => (a.startingPrice ?? 0) - (b.startingPrice ?? 0)),
  }));

  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Commercial" }]}
        eyebrow="Commercial vehicles"
        title="Pick-ups and small commercial vehicles for your business"
        lead={`${trucks.length} Mahindra commercial models with published ex-showroom prices. ${catalog.priceNote}`}
      >
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/get-price" variant="primary">Get on-road price</ButtonLink>
          <ButtonLink href="/contact" variant="secondary">Talk to our team</ButtonLink>
        </div>
      </PageHero>
      {groups.map((g) => (
        <section key={g.label} aria-label={g.label} className="container-x mt-16">
          <SectionHeader title={g.label} lead={`${g.items.length} models`} />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((t) => (
              <VehicleCard key={t.slug} kind="truck" truck={t} />
            ))}
          </div>
        </section>
      ))}
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Commercial", path: "/commercial" }])} />
    </>
  );
}
