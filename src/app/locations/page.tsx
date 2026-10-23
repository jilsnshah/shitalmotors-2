import type { Metadata } from "next";
import { outlets, showrooms, workshops } from "@/lib/content";
import { PageHero } from "@/components/ui/primitives";
import { OutletFinder } from "@/components/locations/outlet-finder";
import { breadcrumbLd, JsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Mahindra Showrooms & Service Centres in Ahmedabad, Sanand and Surendranagar",
  description: `Find all ${showrooms.length} Shital Motors Mahindra showrooms and ${workshops.length} authorised workshops — addresses, phone numbers, opening hours and directions.`,
  alternates: { canonical: "/locations" },
};

export default function LocationsPage() {
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Locations" }]}
        eyebrow="Showrooms & workshops"
        title="Find your nearest Shital Motors"
        lead={`${showrooms.length} showrooms and ${workshops.length} authorised Mahindra workshops across Ahmedabad, Sanand and Surendranagar. Call ahead or get directions.`}
      />
      <section className="container-x mt-10">
        <OutletFinder outlets={outlets} />
      </section>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Locations", path: "/locations" }])} />
    </>
  );
}
