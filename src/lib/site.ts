import { dealer, outlets, showrooms, workshops } from "@/lib/content";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.shitalmotors.com").replace(/\/$/, "");

/** Facts stated on the current website, gathered in one place for reuse. */
export const facts = {
  since: dealer.since, // "providing ... services since 2004" (homepage)
  customers: "2 lakh+", // "served more than 2-lacs satisfied customers" (About Us)
  showroomCount: showrooms.length,
  workshopCount: workshops.length,
  cities: [...new Set(outlets.map((o) => o.city))],
};

export const primarySalesPhone = dealer.contact.salesPhones[0];
export const primaryServicePhone = dealer.contact.serviceBookingPhone ?? dealer.contact.servicePhones[0];
