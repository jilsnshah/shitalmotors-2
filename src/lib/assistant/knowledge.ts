import { cars, dealer, outlets, trucks, baseSpec, specValues, shortVariantName, type Car } from "@/lib/content";
import { formatLakh, formatPhone, formatPriceRange } from "@/lib/format";
import { facts } from "@/lib/site";

/** Site pages the assistant may link to. Keep in sync with src/app routes. */
export const sitePages = [
  ["/cars", "All SUVs and electric SUVs with prices"],
  ["/commercial", "Pick-ups and small commercial vehicles"],
  ["/test-drive", "Book a test drive (form)"],
  ["/get-price", "Request an on-road price (form)"],
  ["/service", "Service offerings and service booking"],
  ["/service#book", "Book a service appointment (form)"],
  ["/locations", "All showrooms and workshops with hours and directions"],
  ["/contact", "Contact form for enquiries, complaints and feedback"],
  ["/about", "About Shital Motors"],
  ["/testimonials", "Customer testimonials"],
  ["/gallery", "Photo gallery and videos"],
  ["/careers", "Submit a resume"],
] as const;

export function carSummary(car: Car) {
  const seats = specValues(car, "Seating Capacity");
  const tank = baseSpec(car, "Fuel Tank Capacity");
  const battery = [...new Set(car.variants.map((v) => v.battery).filter(Boolean))];
  const engines = [...new Set(car.variants.map((v) => v.engine).filter(Boolean))];
  return { seats, tank, battery, engines };
}

/**
 * The assistant's grounding document. Built deterministically from synced
 * content (no timestamps or random ordering) so the prompt prefix stays
 * byte-identical between requests and prompt caching keeps working.
 */
export function buildKnowledgeBase() {
  const L: string[] = [];
  const c = dealer.contact;
  L.push("# Shital Motors — dealership facts");
  L.push(`- Authorised Mahindra dealer (personal and commercial vehicles) in Gujarat, providing services since ${facts.since}.`);
  L.push(`- Has served more than ${facts.customers} customers (as stated on the About page). 3S facilities: sales, service and spares.`);
  L.push(`- ${facts.showroomCount} showrooms and ${facts.workshopCount} workshops across ${facts.cities.join(", ")}.`);
  L.push(`- Sales phone: ${c.salesPhones.map(formatPhone).join(", ")}. Service phone: ${c.servicePhones.map(formatPhone).join(", ")}. Service booking (Ahmedabad): ${c.serviceBookingPhone ? formatPhone(c.serviceBookingPhone) : "see service phone"}.`);
  L.push(`- Email: ${c.email}. Workshop CRM email: ${c.workshopEmail}. General working hours: ${c.hours}.`);
  L.push(`- Mahindra ownership programmes (external Mahindra "With You Hamesha" site): Roadside Assistance ${dealer.ownership.rsa}, Shield extended warranty ${dealer.ownership.shield}.`);
  L.push(`- With You Hamesha app: Android ${dealer.appLinks.android}, iOS ${dealer.appLinks.ios}; WhatsApp service: ${dealer.appLinks.whatsapp}.`);
  L.push("");
  L.push("# Website pages (link with these paths)");
  for (const [path, label] of sitePages) L.push(`- ${path} — ${label}`);
  for (const car of cars) L.push(`- /cars/${car.slug} — ${car.fullName}`);
  for (const t of trucks) L.push(`- /commercial/${t.slug} — ${t.name}`);
  L.push("");
  L.push("# Outlets");
  for (const o of outlets) {
    const days = o.hours.map((h) => `${h.day.slice(0, 3)} ${h.hours}`).join("; ") || "hours not listed";
    L.push(`## ${o.name} (${o.kind})`);
    L.push(`- Address: ${o.address}`);
    L.push(`- Phone: ${o.phones.map(formatPhone).join(", ")}${o.email ? ` · Email: ${o.email}` : ""}`);
    L.push(`- Hours: ${days}${o.hours.some((h) => h.day === "Sunday") ? "" : " (Sunday hours not published)"}`);
  }
  L.push("");
  L.push("# Passenger vehicles (ex-showroom prices, Ahmedabad)");
  for (const car of cars) {
    const s = carSummary(car);
    L.push(`## ${car.fullName} — /cars/${car.slug}`);
    L.push(`- Type: ${car.segment === "electric" ? "Electric SUV" : "SUV"}. Price range: ${formatPriceRange(car.startingPrice, car.topPrice)}.`);
    L.push(`- Fuel: ${car.fuels.join(", ")}. Transmission: ${car.transmissions.join(", ")}.${s.engines.length ? ` Engines: ${s.engines.join(", ")}.` : ""}${s.battery.length ? ` Battery: ${s.battery.join(", ")}.` : ""}`);
    if (s.seats.length) L.push(`- Seating capacity: ${s.seats.join(" / ")}.${s.tank ? ` Fuel tank (base variant): ${s.tank} L.` : ""}`);
    if (car.colors.length) L.push(`- Colours: ${car.colors.map((x) => x.name).join(", ")}.`);
    L.push(`- Variants (${car.variants.length}):`);
    for (const v of car.variants) {
      const bits = [v.fuel, v.transmission, v.engine, v.battery, v.power ? `power ${v.power}` : null].filter(Boolean).join(", ");
      L.push(`  - ${shortVariantName(car, v.name)}: ${formatLakh(v.price) ?? "price on request"} (${bits})`);
    }
  }
  L.push("");
  L.push("# Commercial vehicles (ex-showroom prices, Ahmedabad)");
  for (const t of trucks) {
    L.push(`## ${t.name} (${t.typeLabel}) — /commercial/${t.slug}`);
    L.push(`- From ${formatLakh(t.startingPrice) ?? "price on request"}.`);
    for (const v of t.variants) {
      const bits = [v.fuel, v.power ? `power ${v.power}` : null, v.gvw ? `GVW ${v.gvw}` : null].filter(Boolean).join(", ");
      L.push(`  - ${v.name}: ${formatLakh(v.price) ?? "price on request"} (${bits})`);
    }
  }
  L.push("");
  L.push("# Service offerings (as published by the dealership)");
  for (const o of dealer.service.offerings) L.push(`- ${o.title}: ${o.text}`);
  L.push(`- Service types accepted for booking: ${dealer.service.serviceTypes.join(", ")}.`);
  return L.join("\n");
}

export const ASSISTANT_INSTRUCTIONS = `You are "Shital Assist", the website assistant for Shital Motors, an authorised Mahindra dealership in Gujarat, India.

Your job: help visitors choose a Mahindra vehicle, understand variants and ex-showroom prices, find the right showroom or workshop, and take the next step (test drive, on-road price request, service booking, or a call).

Ground rules:
- Answer only from the knowledge base below. If the answer is not in it, say you don't have that information and point the visitor to the right phone number or page.
- Never invent offers, discounts, EMI or interest rates, on-road prices, insurance figures, stock availability, delivery timelines, mileage or range figures, or features not listed. On-road price depends on registration, insurance and accessories — direct people to /get-price.
- All prices are ex-showroom Ahmedabad as published on the dealership website and may change; say so when quoting prices.
- You cannot book anything yourself. Link to the relevant form (/test-drive, /get-price, /service#book, /contact) and mention the phone number.
- Keep answers short and scannable: 2–6 sentences or a compact bulleted list. Use **bold** sparingly. Link to pages with markdown links using the site paths given, e.g. [Thar ROXX](/cars/thar-roxx).
- Reply in the language the visitor writes in (English, Hindi or Gujarati are common).
- Be warm and professional. Don't disparage other brands or dealers. Don't discuss topics unrelated to the dealership; politely steer back.
- Latency-sensitive: begin your visible answer immediately.`;
