import Link from "next/link";
import { Mail, Phone, Clock, ArrowUpRight } from "lucide-react";
import { Wordmark } from "./wordmark";
import { cars, dealer, showrooms, workshops } from "@/lib/content";
import { formatPhone, telHref } from "@/lib/format";
import { navigation } from "@/content/curation";

const socialLabels = { facebook: "Facebook", instagram: "Instagram", x: "X (Twitter)", linkedin: "LinkedIn" } as const;

export function Footer() {
  const { contact, socials } = dealer;
  return (
    <footer className="relative mt-24 border-t border-line bg-surface">
      <div className="container-x grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <Wordmark />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
            Authorised Mahindra dealer for personal and commercial vehicles, with {showrooms.length} showrooms and{" "}
            {workshops.length} workshops across Ahmedabad, Sanand and Surendranagar.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            <li className="flex gap-3">
              <Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
              <span>
                <span className="text-muted">Sales </span>
                {contact.salesPhones.map((p, i) => (
                  <span key={p}>
                    {i > 0 && ", "}
                    <a className="tabular font-medium hover:text-accent" href={telHref(p)}>{formatPhone(p)}</a>
                  </span>
                ))}
              </span>
            </li>
            <li className="flex gap-3">
              <Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
              <span>
                <span className="text-muted">Service </span>
                {contact.servicePhones.map((p, i) => (
                  <span key={p}>
                    {i > 0 && ", "}
                    <a className="tabular font-medium hover:text-accent" href={telHref(p)}>{formatPhone(p)}</a>
                  </span>
                ))}
              </span>
            </li>
            {contact.email && (
              <li className="flex gap-3">
                <Mail aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
                <a className="font-medium hover:text-accent" href={`mailto:${contact.email}`}>{contact.email}</a>
              </li>
            )}
            {contact.hours && (
              <li className="flex gap-3">
                <Clock aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
                <span>{contact.hours.replace(" to ", " – ")} <span className="text-muted">(showroom hours vary by outlet)</span></span>
              </li>
            )}
          </ul>
        </div>

        <FooterCol title="SUVs" className="md:col-span-2" links={cars.map((c) => ({ label: c.name, href: `/cars/${c.slug}` }))} />
        <FooterCol
          title="Explore"
          className="md:col-span-2"
          links={[
            { label: "All SUVs", href: "/cars" },
            { label: "Electric SUVs", href: "/cars?segment=electric" },
            { label: "Commercial vehicles", href: "/commercial" },
            { label: "Book a test drive", href: "/test-drive" },
            { label: "Get on-road price", href: "/get-price" },
            { label: "Book a service", href: "/service#book" },
            { label: "Showrooms & workshops", href: "/locations" },
          ]}
        />
        <FooterCol title="Company" className="md:col-span-2" links={navigation.company} />
        <div className="md:col-span-2">
          <p className="eyebrow mb-4">Follow</p>
          <ul className="space-y-2.5 text-sm">
            {(Object.keys(socialLabels) as (keyof typeof socialLabels)[]).map((k) =>
              socials[k] ? (
                <li key={k}>
                  <a href={socials[k]!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-ink-2 hover:text-ink">
                    {socialLabels[k]} <ArrowUpRight aria-hidden className="size-3.5 text-subtle" />
                  </a>
                </li>
              ) : null,
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-4 pb-24 pt-6 text-xs text-muted md:flex-row md:items-center md:justify-between md:pb-6 md:pr-64">
          <p>© Shital Motors. All rights reserved. Mahindra and model names are trademarks of their respective owner.</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {navigation.legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-ink">{l.label}</Link>
              </li>
            ))}
            <li>
              <Link href="/sitemap.xml" className="hover:text-ink">Sitemap</Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links, className }: { title: string; links: { label: string; href: string }[]; className?: string }) {
  return (
    <div className={className}>
      <p className="eyebrow mb-4">{title}</p>
      <ul className="space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-ink-2 hover:text-ink">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
