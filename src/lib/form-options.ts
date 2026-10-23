import { cars, catalog, dealer, showrooms, trucks, workshops } from "@/lib/content";
import { formatLakh, formatPhone, telHref } from "@/lib/format";

export type ModelOption = { value: string; label: string; group: string; image: string | null; price: string | null; studio: boolean; variants: string[] };
export type OutletOption = { id: string; label: string; city: string; address: string };
export type FormOptions = {
  models: ModelOption[];
  showrooms: OutletOption[];
  workshops: OutletOption[];
  serviceModels: string[];
  salesPhone: { display: string; href: string };
  servicePhone: { display: string; href: string };
};

const byPrice = <T extends { startingPrice: number | null }>(a: T, b: T) => (a.startingPrice ?? 0) - (b.startingPrice ?? 0);
const toOutlet = (o: (typeof showrooms)[number]): OutletOption => ({ id: o.id, label: `${o.area}`, city: o.city, address: o.address });

/** Lightweight, serialisable option lists for client-side forms. */
export function formOptions(): FormOptions {
  const sales = dealer.contact.salesPhones[0];
  const service = dealer.contact.serviceBookingPhone ?? dealer.contact.servicePhones[0];
  return {
    models: [
      ...[...cars].sort(byPrice).map((c) => ({
        value: c.slug,
        label: c.name,
        group: c.segment === "electric" ? "Electric SUVs" : "SUVs",
        image: c.image.src,
        price: formatLakh(c.startingPrice),
        studio: true,
        variants: c.variants.map((v) => v.name.replace(c.fullName, "").trim()),
      })),
      ...[...trucks].sort(byPrice).map((t) => ({
        value: t.slug,
        label: t.name,
        group: "Commercial vehicles",
        image: t.image.src,
        price: formatLakh(t.startingPrice),
        studio: false,
        variants: t.variants.map((v) => v.name),
      })),
    ],
    showrooms: showrooms.map(toOutlet),
    workshops: workshops.map(toOutlet),
    // Includes discontinued models owners still bring in for service (from the dealership's contact form).
    serviceModels: catalog.serviceModels,
    salesPhone: { display: formatPhone(sales), href: telHref(sales) },
    servicePhone: { display: formatPhone(service), href: telHref(service) },
  };
}

export function groupModels(models: ModelOption[]) {
  const groups = [...new Set(models.map((m) => m.group))];
  return groups.map((g) => ({ label: g, options: models.filter((m) => m.group === g).map((m) => ({ value: m.value, label: m.label })) }));
}
