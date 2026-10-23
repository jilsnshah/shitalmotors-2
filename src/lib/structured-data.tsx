import { dealer, outlets, type Car, type Outlet } from "@/lib/content";
import { siteUrl } from "@/lib/site";

import { parseRange } from "@/lib/hours";

export function openingHoursSpec(o: Outlet) {
  return o.hours
    .map((h) => {
      const r = parseRange(h.hours);
      return r ? { "@type": "OpeningHoursSpecification", dayOfWeek: `https://schema.org/${h.day}`, opens: r[0], closes: r[1] } : null;
    })
    .filter(Boolean);
}


function outletNode(o: Outlet) {
  return {
    "@type": o.kind === "workshop" ? "AutoRepair" : "AutoDealer",
    "@id": `${siteUrl}/locations#${o.id}`,
    name: o.name,
    telephone: o.phones.map((p) => `+91${p}`),
    email: o.email ?? undefined,
    address: { "@type": "PostalAddress", streetAddress: o.address, addressRegion: "Gujarat", postalCode: o.pincode ?? undefined, addressCountry: "IN", addressLocality: o.city },
    geo: o.geo ? { "@type": "GeoCoordinates", latitude: o.geo.lat, longitude: o.geo.lng } : undefined,
    openingHoursSpecification: openingHoursSpec(o),
    brand: { "@type": "Brand", name: "Mahindra" },
  };
}

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": `${siteUrl}/#organization`,
    name: dealer.name,
    url: siteUrl,
    foundingDate: dealer.since ?? undefined,
    email: dealer.contact.email ?? undefined,
    telephone: dealer.contact.salesPhones.map((p) => `+91${p}`),
    brand: { "@type": "Brand", name: "Mahindra" },
    sameAs: Object.values(dealer.socials).filter(Boolean),
    department: outlets.map(outletNode),
  };
}

export function carLd(car: Car) {
  return {
    "@context": "https://schema.org",
    "@type": "Car",
    name: car.fullName,
    brand: { "@type": "Brand", name: "Mahindra" },
    image: `${siteUrl}${car.image.src}`,
    url: `${siteUrl}/cars/${car.slug}`,
    fuelType: car.fuels.join(", "),
    vehicleTransmission: car.transmissions.join(", "),
    offers: car.startingPrice
      ? {
          "@type": "AggregateOffer",
          priceCurrency: "INR",
          lowPrice: car.startingPrice,
          highPrice: car.topPrice ?? car.startingPrice,
          offerCount: car.variants.length,
          seller: { "@id": `${siteUrl}/#organization` },
        }
      : undefined,
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${siteUrl}${it.path}` })),
  };
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
