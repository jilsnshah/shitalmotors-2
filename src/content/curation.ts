/**
 * Editorial curation. Everything here references synced content; nothing is
 * a new claim. Award captions are transcribed from the award photographs
 * published in the dealership's gallery.
 */

/** Models staged in the homepage hero, in order. */
export const heroModels = ["thar-roxx", "xuv-7xo", "xev-9s", "scorpio"] as const;

/** Model used for the homepage colour spotlight (has the widest palette with clean images). */
export const colourSpotlight = "thar-roxx";

/** Award photos whose plaque text is legible, with that text as the caption. */
export const awardCaptions: Record<string, string> = {
  "awards-1139": "JDP CSI 2017 — appreciation for excellent performance",
  "awards-1140": "All India 2nd Best CSI — Ahmedabad AO",
  "awards-1141": "Runner-up, National Mega Camp 2016–17 — Ahmedabad AO",
  "awards-1142": "JDP No. 1, 2015",
  "awards-1143": "Mahindra Best Corporate Leasing & Direct Billing Award, FY-15",
  "awards-1144": "Gujarat Warriors Return — Winner, Group B (Maxximo Plus)",
  "awards-1146": "Mahindra Finance — appreciation for promoting Mahindra Finance as preferred financier",
  "awards-1147": "Best Performer in Accessories, H1 FY-16",
  "awards-1148": "Gujarat Warriors Reloaded — Winner",
  "awards-1150": "Gujarat Warriors Return — 2nd Runner-up, Group A",
  "awards-1151": "All India No. 2 Dealer Award — SSI, FY-14",
  "awards-1152": "SSI JDP 2015 — All India No. 2",
};

/** Featured testimonials (by customer name) for the homepage — chosen for substance and variety of branch. */
export const featuredTestimonials = [
  "Shaikh Sufiyan",
  "Patil Bhushan",
  "Makwana Prashant",
  "Saurabh Shah",
  "NIRAV DAVE",
  "Patel Chetan",
  "Gayatri Anjaria",
  "Ritik Agarwal",
];

/** Branch names customers mention, used to filter testimonials. */
export const testimonialBranches: { label: string; match: RegExp }[] = [
  { label: "Ashram Road", match: /ash?ram/i },
  { label: "Sarkhej", match: /sarkhej/i },
  { label: "Chandkheda", match: /chandkheda/i },
  { label: "Surendranagar", match: /surendranagar/i },
];

export const navigation = {
  primary: [
    { label: "SUVs", href: "/cars" },
    { label: "Commercial", href: "/commercial" },
    { label: "Service", href: "/service" },
    { label: "Locations", href: "/locations" },
  ],
  company: [
    { label: "About us", href: "/about" },
    { label: "Gallery & videos", href: "/gallery" },
    { label: "Testimonials", href: "/testimonials" },
    { label: "Careers", href: "/careers" },
    { label: "Contact", href: "/contact" },
  ],
  legal: [
    { label: "Privacy policy", href: "/legal/privacy" },
    { label: "Terms & conditions", href: "/legal/terms" },
    { label: "Disclaimer", href: "/legal/disclaimer" },
  ],
};
