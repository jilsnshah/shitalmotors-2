/**
 * Offline assistant used when ANTHROPIC_API_KEY is not configured.
 * Rule-based intent matching over the same synced content the live model is
 * grounded in, so demo answers are factual and never made up.
 */
import { cars, dealer, outlets, trucks, showrooms, workshops, shortVariantName, type Car, type Outlet } from "@/lib/content";
import { formatLakh, formatPhone, formatPriceRange } from "@/lib/format";
import { carSummary } from "./knowledge";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9ऀ-૿ ]+/g, " ").replace(/\s+/g, " ").trim();

// Aliases people actually type, mapped to car slugs. Longest matches win.
const CAR_ALIASES = ([
  ...cars.map((c) => [norm(c.name), c.slug] as [string, string]),
  ["roxx", "thar-roxx"],
  ["thar 5 door", "thar-roxx"],
  ["thar og", "thar-og"],
  ["3xo ev", "xuv-3xo-ev"],
  ["xuv3xo ev", "xuv-3xo-ev"],
  ["3xo", "xuv-3xo"],
  ["xuv3xo", "xuv-3xo"],
  ["7xo", "xuv-7xo"],
  ["xuv7xo", "xuv-7xo"],
  ["xuv 700", "xuv-7xo"],
  ["xuv700", "xuv-7xo"],
  ["xuv400", "xuv400-ev"],
  ["xuv 400", "xuv400-ev"],
  ["9s", "xev-9s"],
  ["xev9s", "xev-9s"],
  ["9e", "xev-9e"],
  ["xev9e", "xev-9e"],
  ["be6", "be-6-sporteq"],
  ["be 6", "be-6-sporteq"],
  ["neo plus", "bolero-neo-plus"],
  ["neo", "bolero-neo"],
  ["scorpio", "scorpio"],
  ["bolero", "bolero"],
  ["thar", "thar-roxx"],
] as [string, string][]).sort((a, b) => b[0].length - a[0].length);

function findCars(q: string): Car[] {
  const found: Car[] = [];
  let rest = ` ${q} `;
  for (const [alias, slug] of CAR_ALIASES) {
    const needle = ` ${alias} `;
    if (rest.includes(needle)) {
      const car = cars.find((c) => c.slug === slug);
      if (car && !found.includes(car)) found.push(car);
      rest = rest.replaceAll(needle, " ");
    }
  }
  return found;
}

function findTrucks(q: string) {
  return trucks.filter((t) => {
    const n = norm(t.name);
    return q.includes(n) || n.split(" ").filter((w) => w.length > 3 && q.includes(w)).length >= 2;
  });
}

const AREA_WORDS = ["ashram", "chandkheda", "vishala", "sarkhej", "sanand", "surendranagar", "wadhwan", "bopal", "ring road", "navapura", "changodar", "narol"];

function findOutlets(q: string): Outlet[] {
  return outlets.filter((o) => {
    const hay = norm(`${o.area} ${o.address}`);
    return AREA_WORDS.some((w) => q.includes(w) && hay.includes(w));
  });
}

// Short words must match whole words ("ev" must not match "every"); longer ones match as prefixes ("servic" → "servicing").
const has = (q: string, ...words: string[]) => words.some((w) => new RegExp(`(^| )${w}${w.length <= 3 ? "(?= |$)" : ""}`).test(q));

function budgetFrom(q: string): number | null {
  const m = q.match(/(\d+(?:\.\d+)?)\s*(lakh|lac|l|lakhs|lacs)\b/) ?? (has(q, "under", "below", "budget", "within", "upto", "up to") ? q.match(/(\d+(?:\.\d+)?)/) : null);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return n < 200 ? n * 100000 : n;
}

const outletLine = (o: Outlet) => {
  const hours = o.hours[0]?.hours ?? "hours not listed";
  return `- **${o.name}** (${o.kind}) — ${o.address}. Call ${o.phones.map(formatPhone).join(", ")} · ${hours}`;
};

function carAnswer(car: Car) {
  const s = carSummary(car);
  const lines = [
    `**${car.fullName}** — ${car.segment === "electric" ? "electric SUV" : "SUV"}, ${car.variants.length} variants from **${formatPriceRange(car.startingPrice, car.topPrice)}** (ex-showroom, Ahmedabad).`,
    "",
    `- Fuel: ${car.fuels.join(", ")} · Transmission: ${car.transmissions.join(", ")}`,
  ];
  if (s.engines.length) lines.push(`- Engine: ${s.engines.join(", ")}`);
  if (s.battery.length) lines.push(`- Battery: ${s.battery.join(", ")}`);
  if (s.seats.length) lines.push(`- Seating: ${s.seats.join(" / ")}`);
  if (car.colors.length) lines.push(`- ${car.colors.length} colours, including ${car.colors.slice(0, 3).map((c) => c.name).join(", ")}`);
  lines.push("", `See every variant on the [${car.name} page](/cars/${car.slug}), or [book a test drive](/test-drive?model=${car.slug}).`);
  return lines.join("\n");
}

function compareAnswer(list: Car[]) {
  const rows = list.map((car) => {
    const s = carSummary(car);
    return `- **[${car.name}](/cars/${car.slug})**: ${formatPriceRange(car.startingPrice, car.topPrice)} · ${car.fuels.join("/")} · ${car.transmissions.join("/")}${s.seats.length ? ` · seats ${s.seats.join("/")}` : ""}`;
  });
  return ["Here's how they line up (ex-showroom, Ahmedabad):", "", ...rows, "", "A test drive is the best way to decide — [book one here](/test-drive)."].join("\n");
}

export function demoAnswer(input: string): string {
  const q = norm(input);
  const c = dealer.contact;
  const sales = c.salesPhones.map(formatPhone).join(" or ");
  const service = (c.serviceBookingPhone ? [c.serviceBookingPhone] : c.servicePhones).map(formatPhone).join(" or ");

  if (!q) return "Ask me about Mahindra models, prices, showrooms, test drives or service.";

  const matchedCars = findCars(q);
  const matchedOutlets = findOutlets(q);

  if (has(q, "hi", "hello", "hey", "namaste", "kem cho") && q.split(" ").length <= 3)
    return "Hello! I can help you compare Mahindra SUVs, check ex-showroom prices, find a showroom or workshop, and book a test drive or service. What are you looking for?";

  if (has(q, "career", "job", "vacanc", "resume", "hiring"))
    return "You can send your resume through our [careers page](/careers). We'll get in touch if there's a suitable opening.";

  if (has(q, "rsa", "roadside", "breakdown", "tow", "shield", "extended warranty", "warranty"))
    return [
      "Mahindra runs these ownership programmes on its With You Hamesha site:",
      "",
      `- [Roadside Assistance](${dealer.ownership.rsa})`,
      `- [Shield extended warranty](${dealer.ownership.shield})`,
      "",
      `For help with either, call our service team on ${service}.`,
    ].join("\n");

  if (has(q, "service", "servicing", "repair", "workshop", "maintenance", "accident", "body shop", "dent", "paint") && !matchedCars.length) {
    const ws = matchedOutlets.filter((o) => o.kind === "workshop");
    return [
      `Our workshops offer ${dealer.service.offerings.map((o) => o.title).join(", ")}. For example, **Qwik Service** completes a scheduled service in about 90 minutes.`,
      "",
      ...(ws.length ? ws : workshops).map(outletLine),
      "",
      `[Book a service appointment](/service#book) or call ${service}.`,
    ].join("\n");
  }

  if (matchedOutlets.length || has(q, "where", "address", "location", "showroom", "outlet", "branch", "near", "directions", "map")) {
    const list = matchedOutlets.length ? matchedOutlets : showrooms;
    return [
      matchedOutlets.length ? "Here's what I found:" : `We have ${showrooms.length} showrooms and ${workshops.length} workshops. Showrooms:`,
      "",
      ...list.map(outletLine),
      "",
      "See hours and directions for every outlet on the [locations page](/locations).",
    ].join("\n");
  }

  if (has(q, "timing", "hours", "open", "close", "sunday")) {
    return [
      `General working hours are ${c.hours}. Hours differ by outlet — for example:`,
      "",
      ...outlets.slice(0, 4).map((o) => `- ${o.name}: ${o.hours.map((h) => `${h.day.slice(0, 3)} ${h.hours}`).slice(-2).join(", ")}`),
      "",
      "Full weekly hours are on the [locations page](/locations).",
    ].join("\n");
  }

  if (has(q, "test drive", "testdrive", "drive")) {
    const car = matchedCars[0];
    return `You can [book a test drive${car ? ` of the ${car.name}` : ""}](/test-drive${car ? `?model=${car.slug}` : ""}) at the showroom of your choice. Prefer to talk? Call sales on ${sales}.`;
  }

  if (has(q, "emi", "loan", "finance", "interest", "discount", "offer", "deal", "on road", "onroad", "insurance", "stock", "waiting", "delivery"))
    return `I don't have current offers, finance rates, stock or on-road figures — those change often and depend on your city and choices. [Request an on-road price](/get-price${matchedCars[0] ? `?model=${matchedCars[0].slug}` : ""}) and our sales team will share exact numbers, or call ${sales}.`;

  if (matchedCars.length >= 2 || (matchedCars.length && has(q, "compare", "vs", "versus", "difference"))) return compareAnswer(matchedCars);

  if (matchedCars.length === 1) {
    const car = matchedCars[0];
    if (has(q, "colour", "color"))
      return `The ${car.name} is listed in ${car.colors.length} colours: ${car.colors.map((x) => x.name).join(", ")}. You can preview them on the [${car.name} page](/cars/${car.slug}).`;
    if (has(q, "variant", "price", "cost", "kitna", "rate", "top model", "base model")) {
      const v = [...car.variants].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      return [
        `**${car.name}** ex-showroom prices (Ahmedabad):`,
        "",
        ...v.slice(0, 6).map((x) => `- ${shortVariantName(car, x.name)} — ${formatLakh(x.price) ?? "price on request"}`),
        ...(v.length > 6 ? [`- …and ${v.length - 6} more, up to ${formatLakh(car.topPrice)}`] : []),
        "",
        `Full list on the [${car.name} page](/cars/${car.slug}#variants). Prices may change; [request an on-road price](/get-price?model=${car.slug}).`,
      ].join("\n");
    }
    return carAnswer(car);
  }

  const matchedTrucks = findTrucks(q);
  if (matchedTrucks.length || has(q, "commercial", "pickup", "pik up", "pick up", "truck", "cargo", "supro", "veero", "camper", "business"))
    return [
      "Our commercial range (ex-showroom, Ahmedabad):",
      "",
      ...(matchedTrucks.length ? matchedTrucks : trucks).map((t) => `- [${t.name}](/commercial/${t.slug}) — ${t.typeLabel}, from ${formatLakh(t.startingPrice) ?? "price on request"}`),
      "",
      "See them all on the [commercial vehicles page](/commercial).",
    ].join("\n");

  const budget = budgetFrom(q);
  if (budget) {
    const fit = cars.filter((car) => car.startingPrice && car.startingPrice <= budget).sort((a, b) => (a.startingPrice ?? 0) - (b.startingPrice ?? 0));
    if (!fit.length) return `None of our SUVs start under ${formatLakh(budget)} ex-showroom. The most accessible is the ${[...cars].sort((a, b) => (a.startingPrice ?? 0) - (b.startingPrice ?? 0))[0].name}. [See all SUVs](/cars).`;
    return [`SUVs with a starting ex-showroom price within ${formatLakh(budget)}:`, "", ...fit.map((car) => `- [${car.name}](/cars/${car.slug}) — from ${formatLakh(car.startingPrice)}`), "", "Prices vary by variant; on-road prices are higher."].join("\n");
  }

  if (has(q, "electric", "ev", "evs", "battery", "charging"))
    return [
      "Our electric SUVs:",
      "",
      ...cars.filter((x) => x.segment === "electric").map((x) => `- [${x.name}](/cars/${x.slug}) — from ${formatLakh(x.startingPrice)}${carSummary(x).battery.length ? ` · ${carSummary(x).battery.join(" / ")}` : ""}`),
      "",
      "For range and charging details, our sales team can walk you through the brochure.",
    ].join("\n");

  for (const [word, label] of [["diesel", "Diesel"], ["petrol", "Petrol"], ["automatic", "Automatic"]] as const) {
    if (has(q, word)) {
      const list = cars.filter((x) => x.fuels.includes(label) || x.transmissions.includes(label));
      return [`Models available with ${label.toLowerCase()}${word === "automatic" ? " transmission" : ""}:`, "", ...list.map((x) => `- [${x.name}](/cars/${x.slug}) — from ${formatLakh(x.startingPrice)}`)].join("\n");
    }
  }

  if (has(q, "7 seat", "seven seat", "family", "7 seater", "seater")) {
    const list = cars.filter((x) => carSummary(x).seats.some((s) => parseInt(s, 10) >= 7));
    return [`Models with a 7-seat (or larger) configuration:`, "", ...list.map((x) => `- [${x.name}](/cars/${x.slug}) — seats ${carSummary(x).seats.join("/")}`)].join("\n");
  }

  if (has(q, "contact", "phone", "call", "number", "email", "whatsapp"))
    return `Sales: ${sales}. Service: ${c.servicePhones.map(formatPhone).join(", ")}. Email: ${c.email}. Or send us a message through the [contact page](/contact).`;

  if (has(q, "about", "who are you", "since", "history", "award"))
    return `Shital Motors has been an authorised Mahindra dealer since ${dealer.since}, with ${showrooms.length} showrooms and ${workshops.length} workshops across Ahmedabad, Sanand and Surendranagar. [Read more about us](/about).`;

  return [
    "I can help with:",
    "",
    "- Models and variants — e.g. “Thar ROXX diesel automatic prices”",
    "- Comparisons — e.g. “XUV 7XO vs Scorpio”",
    "- Budgets — e.g. “SUVs under 12 lakh”",
    "- Showrooms, workshops and hours",
    "- Test drives and service bookings",
    "",
    `Or talk to a person: sales ${sales}.`,
  ].join("\n");
}
