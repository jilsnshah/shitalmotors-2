import type { Metadata } from "next";
import { Suspense } from "react";
import { cars, catalog, specValues } from "@/lib/content";
import { PageHero } from "@/components/ui/primitives";
import { ModelExplorer, type ExplorerItem } from "@/components/vehicles/model-explorer";
import { carTile, VehicleTile } from "@/components/vehicles/vehicle-card";
import { breadcrumbLd, JsonLd } from "@/lib/structured-data";
import { formatLakh } from "@/lib/format";

export const metadata: Metadata = {
  title: "Mahindra SUVs & Electric SUVs — Prices and Variants",
  description: `Compare ${cars.length} Mahindra SUVs and electric SUVs at Shital Motors with ex-showroom prices in Ahmedabad, from ${formatLakh(Math.min(...cars.map((c) => c.startingPrice ?? Infinity)))}. Filter by fuel, transmission, seating and budget.`,
  alternates: { canonical: "/cars" },
};

export default function CarsPage() {
  const items: ExplorerItem[] = cars.map((car) => ({
    ...carTile(car),
    slug: car.slug,
    segment: car.segment,
    fuels: car.fuels,
    transmissions: car.transmissions,
    seats: specValues(car, "Seating Capacity").map((s) => parseInt(s, 10)).filter(Number.isFinite),
    from: car.startingPrice ?? 0,
  }));

  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "SUVs" }]}
        eyebrow="SUVs & electric SUVs"
        title="Find the Mahindra that fits your life"
        lead={`${cars.length} models, ${cars.reduce((n, c) => n + c.variants.length, 0)} variants, every price published. ${catalog.priceNote}`}
      />
      <section className="container-x mt-10">
        {/* Static fallback = the full, crawlable list; the explorer adds filtering once hydrated. */}
        <Suspense
          fallback={
            <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.sort((a, b) => a.from - b.from).map((item) => (
                <li key={item.slug}>
                  <VehicleTile data={item} />
                </li>
              ))}
            </ul>
          }
        >
          <ModelExplorer items={items} />
        </Suspense>
      </section>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "SUVs", path: "/cars" }])} />
    </>
  );
}
