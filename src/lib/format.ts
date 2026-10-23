/** ₹12.52 lakh — matches how the dealership quotes ex-showroom prices. */
export function formatLakh(amount: number | null | undefined, { short = false } = {}) {
  if (!amount) return null;
  const lakh = amount / 100000;
  const n = lakh >= 100 ? (lakh / 100).toFixed(2) + (short ? " Cr" : " crore") : lakh.toFixed(2) + (short ? " L" : " lakh");
  return `₹${n}`;
}

export function formatPriceRange(from: number | null, to: number | null) {
  const a = formatLakh(from);
  const b = formatLakh(to);
  if (!a) return null;
  if (!b || from === to) return a;
  return `${a} – ${b.replace("₹", "₹")}`;
}

/** 9375808050 → 93758 08050 (Indian mobile grouping). */
export function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "").slice(-10);
  return d.length === 10 ? `${d.slice(0, 5)} ${d.slice(5)}` : phone;
}

export const telHref = (phone: string) => `tel:+91${phone.replace(/\D/g, "").slice(-10)}`;

export function directionsHref(o: { geo: { lat: number; lng: number } | null; address: string; name: string }) {
  const dest = o.geo ? `${o.geo.lat},${o.geo.lng}` : `${o.name}, ${o.address}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`;
}

export function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function plural(n: number, one: string, many = one + "s") {
  return `${n} ${n === 1 ? one : many}`;
}
