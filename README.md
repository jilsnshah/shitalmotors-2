# Shital Motors — website

A redesigned, production-ready website for **Shital Motors**, an authorised Mahindra dealer with showrooms and workshops in Ahmedabad, Sanand and Surendranagar. It replaces the dealer-platform site at <https://www.shitalmotors.com>, and every fact, price, image and text on it comes from that site.

## Quick start

Requires **Node.js 20.9+** (developed on Node 22).

```bash
npm install
npm run dev          # http://localhost:3000
```

Production:

```bash
npm run build
npm start            # http://localhost:3000
```

No environment variables are needed. Without them the AI assistant and the lead forms run in a clearly labelled **demo mode**. To connect real services, copy `.env.example` to `.env.local` (see [Integrations](#integrations)).

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server (Turbopack) |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` · `npm run typecheck` | ESLint (incl. React Compiler rules) · TypeScript |
| `npm run test:e2e` | Playwright end-to-end + accessibility tests (run `npm run build` first) |
| `npm run content:sync` | Re-import content and media from the live dealership site |

## What's inside

**Stack:** Next.js 16 (App Router, Cache Components, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 · Zod · Anthropic SDK · lucide-react · Playwright + axe-core.

All 51 pages are prerendered at build time. Only `/api/chat`, `/api/leads` and the generated Open Graph image run on the server.

### Information architecture

The structure follows the current site's own content and journeys, reorganised around what visitors come to do:

| Route | Content |
| --- | --- |
| `/` | Hero model stage, quick actions (price, test drive, service, outlets), the full range, colour studio, about, service, testimonials, outlet map, deliveries and videos, contact |
| `/cars`, `/cars/[slug]` | 13 SUVs and electric SUVs. The listing has filters for type, fuel, transmission, seating and budget. Each model page has a colour configurator, a filterable variant and price table, brochures, specs per variant, a lightbox gallery and related models |
| `/commercial`, `/commercial/[slug]` | 10 pick-ups and small commercial vehicles, each with its variants |
| `/service` | Service offerings, appointment booking, workshops, Mahindra ownership programmes (RSA, Shield, With You Hamesha app and WhatsApp), videos, gallery |
| `/locations` | 6 showrooms and 4 workshops: a dependency-free map plotted from published coordinates, filters, live open/closed status (IST), weekly hours, call and directions |
| `/test-drive`, `/get-price` | Lead forms. They take `?model=` and `&variant=` so any page can link straight into them |
| `/about`, `/gallery`, `/testimonials`, `/contact`, `/careers`, `/legal/*` | Company, media, all 56 published testimonials (filterable by the branch they mention), contact, resume upload, legal text |

All old `*.html` URLs return 308 redirects to the new routes (`next.config.ts`), so search rankings and bookmarks carry over. Unknown model slugs return a real 404 (`src/proxy.ts`).

### Design system — "Studio"

Defined as tokens in `src/app/globals.css` (`@theme`):

- **Canvas and surfaces:** a warm off-white page (`canvas`), white cards (`surface`) and hairline borders.
- **Studio grey (`#e0e0e2`):** the exact background of the OEM car photography. Car "stages" use it, so the photos read as cut-outs. A `.stage::after` overlay above the image adds depth without exposing the photo edge.
- **Ink and a single accent:** near-black ink for type and primary UI. Mahindra-adjacent red is reserved for action. Teal marks electric models.
- **Type:** Archivo (variable width axis, used expanded for display) and Inter for text. Headings use fluid `clamp()` sizes.
- **Depth and motion:** layered low-contrast shadows. Card lift and photo zoom on hover. Cross-faded colour swaps. Scroll reveals are pure CSS (`animation-timeline: view()`), with no JavaScript and no effect in browsers that lack support. Everything respects `prefers-reduced-motion`.
- **Components** live in `src/components/{ui,layout,vehicles,forms,locations,media,assistant,home,testimonials}`.

### Content pipeline

`scripts/sync-content.mjs` scrapes the current website into typed JSON and downloads all media locally. It covers models, variants, ex-showroom prices, brochures, colours, pictures, specifications, commercial vehicles, outlets (addresses, phones, coordinates, hours), testimonials, gallery, videos, service offerings, form option lists and legal text.

- Output goes to `src/content/generated/{catalog,dealer,slugs}.json` and `public/media/**` (341 images, served through `next/image` as AVIF/WebP).
- Raw HTML is cached in `.content-cache/` (git-ignored). `npm run content:sync -- --offline` re-parses without network access.
- Editorial choices live in `src/content/curation.ts`: hero models, featured testimonials, and award captions transcribed from the award photos. These choices only reference synced content and add no new claims.
- Run the sync whenever prices or models change on the source platform, then rebuild.

## Integrations

### Shital Assist — AI chatbot

A floating assistant on every page. It is lazy-loaded on first open, streams replies, renders links to site pages, keeps the conversation for the browser tab, and can be opened with a question from any page (for example "Ask about the XEV 9e").

- **Live mode** (`ANTHROPIC_API_KEY` set): `src/app/api/chat/route.ts` calls Claude (`claude-opus-5-5`, low effort for chat latency) with a system prompt plus a knowledge base built from the synced content (`src/lib/assistant/knowledge.ts`). The knowledge base is deterministic and marked for prompt caching, so repeat requests reuse the cached prefix. Server-side refusal fallback (`fallbacks: "default"`) is enabled. The instructions forbid inventing offers, EMI or finance figures, on-road prices, stock or delivery times; for those, the assistant points to `/get-price` or a phone number. It replies in English, Hindi or Gujarati to match the visitor.
- **Demo mode** (no key): `src/lib/assistant/demo-engine.ts` is a rule-based engine over the same data. It handles model and variant prices, comparisons, budgets, electric/fuel/transmission and seating filters, outlets and hours, service, test drives, RSA/Shield and contact. The UI labels it "Demo mode".
- Requests are validated with Zod and rate-limited per IP.

### Lead forms

Test drive, on-road price, service booking, contact and careers forms all post to `/api/leads`.

- One Zod schema per form (`src/lib/leads/schema.ts`) validates both in the browser and on the server. The rules mirror the current site: letters-only names, 10-digit mobiles starting 6–9, registration-number format, and resumes in JPG/DOC/PDF/DOCX up to 300 KB.
- Spam protection: a honeypot field and rate limiting.
- **Delivery** (`src/lib/leads/deliver.ts`): with `LEAD_WEBHOOK_URL` set, each lead is POSTed as JSON (with an optional `x-lead-secret` header). This works for a CRM or DMS, Zapier/Make, a Google Apps Script or a Slack workflow. Resumes are base64-encoded in the same payload.
- Without the webhook, leads are logged on the server and the success screen tells the visitor nothing was sent, with the phone number to call.

## Testing

```bash
npm run build
npm run test:e2e
# In a sandbox with a system Chromium:
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/path/to/chromium npm run test:e2e
```

30 tests run on a desktop profile and a Pixel 7 profile. They cover:

- Navigation: hero, tabs, mega menu, mobile drawer, redirects, real 404s.
- Vehicle pages: filters, URL sync, colour configurator, variant table, specs, lightbox, deep-linked price form.
- Every form: validation, focus management, success and demo states, file checks, server-side rejection.
- The assistant: grounded answers, persistence, hand-off from model pages, no invented offers.
- Locations: filters, map selection, hash deep links.
- Accessibility: axe WCAG 2.1 AA on 8 key pages, with zero serious or critical violations.
- Mobile: no horizontal overflow on 8 key pages.

## Deployment

- **Any Node host:** run `npm run build && npm start` behind HTTPS. **Vercel:** works with zero config.
- Set `NEXT_PUBLIC_SITE_URL`, plus `ANTHROPIC_API_KEY` and `LEAD_WEBHOOK_URL` when ready.
- The in-memory rate limiter is per instance. On multiple instances, swap it for a shared store (`src/lib/rate-limit.ts`).

## Before launch — content to verify with the dealership

These items are carried over from the current website as published. Nothing has been invented to fill gaps.

1. **Privacy policy and terms are reproduced verbatim.** The current policy says the site uses no SSL certificate and runs Google AdSense. Neither is true of this site, so legal review is needed before launch.
2. **Power figures:** the source labels values such as Thar ROXX diesel "150 kW". These look like PS/bhp figures with the wrong unit. They are shown as published, with a note on the page; confirm them against brochures.
3. **Outlet counts:** the About text says "4 showrooms and 3 workshops", but the outlet directory lists 6 and 4. The site uses the directory.
4. **Navapura workshop** has no published coordinates, so it is listed but not plotted on the map.
5. Some commercial variants have no published price and show "On request".
6. Excluded from the source:
   - Outlet-page reviews, which contain spam.
   - One "testimonial" that is actually a video-shoot request.
   - The homepage "about" paragraph, which is machine-garbled.
7. Vehicle photography comes from the same OEM/CarDekho CDNs the current site uses. Confirm the usage rights carry over.
8. The logo on the current site is a plain text wordmark, so it is set in type here. Swap in an official logo file if one exists.
