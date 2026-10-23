/** "10:00 AM – 7:00 PM" → ["10:00", "19:00"] (24h), or null if unparseable. */
export function parseRange(text: string): [string, string] | null {
  const m = text.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\s*[–-]\s*(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if (!m) return null;
  const to24 = (h: string, min: string | undefined, ap: string) => {
    let hh = parseInt(h, 10) % 12;
    if (ap.toUpperCase() === "PM") hh += 12;
    return `${String(hh).padStart(2, "0")}:${min ?? "00"}`;
  };
  return [to24(m[1], m[2], m[3]), to24(m[4], m[5], m[6])];
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export type OpenState = { state: "open" | "closed" | "unknown"; label: string };

/** Open/closed right now in India Standard Time, from the published weekly hours. */
export function openState(hours: { day: string; hours: string }[], now = new Date()): OpenState {
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = DAYS[ist.getDay()];
  const today = hours.find((h) => h.day === day);
  if (!today) return { state: "unknown", label: `${day} hours not published` };
  const range = parseRange(today.hours);
  if (!range) return { state: "unknown", label: today.hours };
  const mins = ist.getHours() * 60 + ist.getMinutes();
  const [o, c] = range.map((t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  });
  if (mins >= o && mins < c) return { state: "open", label: `Open now · until ${today.hours.split(/[–-]/)[1].trim()}` };
  if (mins < o) return { state: "closed", label: `Closed · opens ${today.hours.split(/[–-]/)[0].trim()}` };
  return { state: "closed", label: "Closed now" };
}

/** Collapses identical consecutive days: "Mon – Sat 10 AM – 7 PM". */
export function summariseHours(hours: { day: string; hours: string }[]) {
  const out: { days: string; hours: string }[] = [];
  for (const h of hours) {
    const last = out.at(-1);
    const short = h.day.slice(0, 3);
    if (last && last.hours === h.hours) last.days = `${last.days.split(" – ")[0]} – ${short}`;
    else out.push({ days: short, hours: h.hours });
  }
  return out;
}
