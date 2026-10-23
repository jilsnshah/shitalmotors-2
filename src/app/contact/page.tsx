import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import { dealer, showrooms, workshops } from "@/lib/content";
import { formatPhone, telHref } from "@/lib/format";
import { formOptions } from "@/lib/form-options";
import { PageHero } from "@/components/ui/primitives";
import { ContactForm } from "@/components/forms/contact-form";
import { AskAssistantButton } from "@/components/assistant/ask-button";
import { breadcrumbLd, JsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact Shital Motors for car enquiries, service bookings, complaints and feedback. Sales, service and email contacts for all Mahindra showrooms and workshops.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const c = dealer.contact;
  const blocks = [
    { icon: Phone, title: "Sales", lines: c.salesPhones.map((p) => ({ label: formatPhone(p), href: telHref(p) })) },
    { icon: Phone, title: "Service", lines: c.servicePhones.map((p) => ({ label: formatPhone(p), href: telHref(p) })) },
    { icon: Mail, title: "Email", lines: [c.email, c.workshopEmail].filter(Boolean).map((e) => ({ label: e!, href: `mailto:${e}` })) },
    { icon: Clock, title: "Working hours", lines: [{ label: `${c.hours?.replace(" to ", " – ")} (varies by outlet)`, href: undefined }] },
  ];
  return (
    <>
      <PageHero breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]} eyebrow="Contact us" title="How can we help?" lead="Send us a message about buying, servicing, a complaint or feedback — or reach the right team directly." />
      <section className="container-x mt-10 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ContactForm options={formOptions()} />
        </div>
        <aside className="space-y-4 lg:col-span-5">
          {blocks.map(({ icon: Icon, title, lines }) => (
            <div key={title} className="flex gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-xs">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-sunken">
                <Icon aria-hidden className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-muted">{title}</p>
                {lines.map((l) =>
                  l.href ? (
                    <a key={l.label} href={l.href} className="tabular block break-words font-medium hover:text-accent">{l.label}</a>
                  ) : (
                    <p key={l.label} className="font-medium">{l.label}</p>
                  ),
                )}
              </div>
            </div>
          ))}
          <div className="rounded-[var(--radius-card)] bg-ink p-6 text-white">
            <p className="font-display text-lg font-semibold [font-variation-settings:'wdth'_108]">Quick question?</p>
            <p className="mt-1 text-sm text-white/70">Shital Assist can answer questions about models, prices and outlets right away.</p>
            <AskAssistantButton className="mt-4 bg-white !text-ink hover:bg-white/90">
              <Sparkles aria-hidden className="size-4" /> Ask Shital Assist
            </AskAssistantButton>
          </div>
          <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-xs">
            <p className="flex items-center gap-2 text-sm text-muted">
              <MapPin aria-hidden className="size-4" /> {showrooms.length} showrooms · {workshops.length} workshops
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              {[...showrooms, ...workshops].map((o) => (
                <li key={o.id}>
                  <Link href={`/locations#${o.id}`} className="hover:text-accent">
                    {o.area} <span className="text-subtle">· {o.kind === "workshop" ? "Workshop" : "Showroom"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
    </>
  );
}
