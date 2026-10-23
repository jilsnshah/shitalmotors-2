import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CarFront, Calculator, LifeBuoy, Phone, ShieldCheck, Sparkles, Timer, Truck, Smartphone, MessageCircle } from "lucide-react";
import { dealer, isMedia, workshops } from "@/lib/content";
import { formatPhone, telHref } from "@/lib/format";
import { formOptions } from "@/lib/form-options";
import { summariseHours } from "@/lib/hours";
import { ButtonLink } from "@/components/ui/button";
import { Breadcrumbs, SectionHeader } from "@/components/ui/primitives";
import { ServiceForm } from "@/components/forms/service-form";
import { YouTubeLite } from "@/components/media/youtube-lite";
import { LightboxGallery } from "@/components/media/lightbox-gallery";
import { breadcrumbLd, JsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Mahindra Service Centre — Book a Service",
  description: `Book a Mahindra service at Shital Motors' ${workshops.length} authorised workshops in Ahmedabad and Surendranagar. Qwik Service, mEES body repair estimates, Pick n Drop, Service on Wheels and roadside assistance.`,
  alternates: { canonical: "/service" },
};

const OFFERING_ICONS: Record<string, typeof Timer> = {
  "Qwik Service": Timer,
  mEES: Calculator,
  mSoW: Truck,
  "Pick n Drop": CarFront,
  "Roadside Assistance": LifeBuoy,
  Maxicare: Sparkles,
};
const OFFERING_NAMES: Record<string, string> = {
  mEES: "Mahindra Electronic Estimation System",
  mSoW: "Mahindra Service on Wheels",
};

export default function ServicePage() {
  const { service, contact, ownership, appLinks } = dealer;
  const bookingPhone = contact.serviceBookingPhone ?? contact.servicePhones[0];
  const photos = service.gallery.filter(isMedia);
  const hero = photos.find((p) => p.src.includes("9082")) ?? photos[0];

  return (
    <>
      <section className="relative overflow-hidden border-b border-line bg-surface">
        <div className="container-x grid gap-10 pb-14 pt-8 md:pt-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Service" }]} />
            <p className="eyebrow mt-10">Authorised Mahindra service</p>
            <h1 className="display-lg mt-4">Service that keeps your Mahindra at its best</h1>
            <p className="lead mt-5 max-w-xl">
              {service.intro[0]?.replace("Channel Partner", "channel partner")} We aim at customer delight by exceeding expectations, with absolute transparency.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="#book" variant="primary" size="lg">Book a service</ButtonLink>
              <ButtonLink href={telHref(bookingPhone)} variant="secondary" size="lg">
                <Phone aria-hidden className="size-4" /> {formatPhone(bookingPhone)}
              </ButtonLink>
            </div>
          </div>
          {hero && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-stage)] shadow-lift lg:col-span-6">
              <Image src={hero.src} alt="Service bays with vehicle lifts at a Shital Motors workshop" fill fetchPriority="high" loading="eager" sizes="(min-width: 1024px) 45vw, 92vw" className="object-cover" />
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="offerings-title" className="container-x pt-20">
        <SectionHeader id="offerings-title" eyebrow="Service offerings" title="More ways to look after your vehicle" />
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {service.offerings.map((o) => {
            const Icon = OFFERING_ICONS[o.title] ?? Sparkles;
            return (
              <li key={o.title} className="reveal rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-xs">
                <span className="grid size-11 place-items-center rounded-xl bg-sunken text-ink">
                  <Icon aria-hidden className="size-5" />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold [font-variation-settings:'wdth'_108]">{o.title}</h3>
                {OFFERING_NAMES[o.title] && <p className="text-xs uppercase tracking-wider text-subtle">{OFFERING_NAMES[o.title]}</p>}
                <p className="mt-3 text-sm leading-relaxed text-muted">{o.text}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section id="book" aria-labelledby="book-title" className="scroll-mt-24 pt-24">
        <div className="container-x grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="eyebrow">Book a service</p>
            <h2 id="book-title" className="heading-lg mt-3">Request an appointment</h2>
            <p className="mt-4 leading-relaxed text-ink-2">Choose a workshop and a time that suits you. A service advisor will call to confirm.</p>
            <ul className="mt-8 space-y-4">
              {workshops.map((w) => (
                <li key={w.id} className="rounded-2xl border border-line bg-surface p-4 text-sm">
                  <Link href={`/locations#${w.id}`} className="font-medium hover:text-accent">{w.area}</Link>
                  <p className="text-muted">{w.city}</p>
                  <p className="mt-1 text-muted">{summariseHours(w.hours).map((h) => `${h.days} ${h.hours}`).join(" · ")}</p>
                  <a href={telHref(w.phones[0])} className="tabular mt-2 inline-flex items-center gap-1.5 font-medium text-ink hover:text-accent">
                    <Phone aria-hidden className="size-3.5" /> {formatPhone(w.phones[0])}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-8">
            <ServiceForm options={formOptions()} />
          </div>
        </div>
      </section>

      <section aria-labelledby="ownership-title" className="container-x pt-24">
        <SectionHeader id="ownership-title" eyebrow="Ownership" title="Mahindra ownership programmes" lead="These programmes are offered by Mahindra through its With You Hamesha platform; links open Mahindra's website." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { href: ownership.rsa, icon: LifeBuoy, title: "Buy Roadside Assistance", text: "Help when you're stranded — for as long as 8 years of owning a Mahindra SUV." },
            { href: ownership.shield, icon: ShieldCheck, title: "Buy Shield", text: "Mahindra's Shield programme, available through With You Hamesha." },
            { href: appLinks.whatsapp, icon: MessageCircle, title: "With You Hamesha on WhatsApp", text: "Mahindra's service channel is also available on WhatsApp." },
          ]
            .filter((c) => c.href)
            .map(({ href, icon: Icon, title, text }) => (
              <a key={title} href={href!} target="_blank" rel="noopener noreferrer" className="group flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-xs transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-card">
                <span className="flex items-center justify-between">
                  <Icon aria-hidden className="size-6 text-ink" />
                  <ArrowUpRight aria-hidden className="size-4 text-subtle transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </span>
                <span className="mt-5 font-medium">{title}</span>
                <span className="mt-1 text-sm leading-relaxed text-muted">{text}</span>
              </a>
            ))}
        </div>
        {(appLinks.android || appLinks.ios) && (
          <div className="mt-5 flex flex-col gap-4 rounded-[var(--radius-card)] bg-ink p-6 text-white md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-center gap-4">
              <span className="grid size-12 place-items-center rounded-2xl bg-white/10">
                <Smartphone aria-hidden className="size-6" />
              </span>
              <div>
                <p className="font-display text-lg font-semibold [font-variation-settings:'wdth'_108]">Download the With You Hamesha app</p>
                <p className="text-sm text-white/70">Mahindra&apos;s one-stop app for your SUV service needs.</p>
              </div>
            </div>
            <div className="flex gap-3">
              {appLinks.android && (
                <a href={appLinks.android} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-full bg-white px-5 text-sm font-medium text-ink hover:bg-white/90">Google Play</a>
              )}
              {appLinks.ios && (
                <a href={appLinks.ios} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center rounded-full px-5 text-sm font-medium ring-1 ring-white/30 hover:bg-white/10">App Store</a>
              )}
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="videos-title" className="container-x pt-24">
        <SectionHeader id="videos-title" eyebrow="Service videos" title="Walkaround and customer stories" />
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {service.walkaround && <YouTubeLite id={service.walkaround} title="Service walkaround video" thumb={service.walkaroundThumb?.src ?? null} />}
          {service.videos.map((v) => (
            <YouTubeLite key={v.id} id={v.id} title={v.title.replace(/^SHITAL MOTORS PVT LTD-\s*/i, "")} thumb={v.thumb?.src ?? null} />
          ))}
        </div>
      </section>

      {photos.length > 0 && (
        <section aria-labelledby="sgallery-title" className="container-x pt-24">
          <SectionHeader id="sgallery-title" eyebrow="Service gallery" title="Inside our workshops" />
          <LightboxGallery className="mt-10" images={photos.map((p, i) => ({ src: p.src, alt: `Shital Motors service centre (${i + 1})` }))} />
        </section>
      )}
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Service", path: "/service" }])} />
    </>
  );
}
