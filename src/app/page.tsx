import Image from "next/image";
import { ArrowRight, Clock, Phone, Sparkles, Mail } from "lucide-react";
import { cars, trucks, dealer, getCar, outlets, showrooms, workshops, isMedia } from "@/lib/content";
import { formatLakh, formatPhone, telHref } from "@/lib/format";
import { facts } from "@/lib/site";
import { heroModels, colourSpotlight, featuredTestimonials } from "@/content/curation";
import { HeroStage, type HeroModel } from "@/components/home/hero-stage";
import { QuickActions } from "@/components/home/quick-actions";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { ColourStage } from "@/components/vehicles/colour-stage";
import { Tabs } from "@/components/ui/tabs";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeader, TextLink, Stat } from "@/components/ui/primitives";
import { TestimonialCard } from "@/components/testimonials/testimonial-card";
import { OutletMap } from "@/components/locations/outlet-map";
import { YouTubeLite } from "@/components/media/youtube-lite";
import { AskAssistantButton } from "@/components/assistant/ask-button";

const byPrice = <T extends { startingPrice: number | null }>(a: T, b: T) => (a.startingPrice ?? 0) - (b.startingPrice ?? 0);

export default function Home() {
  const hero: HeroModel[] = heroModels
    .map((slug) => getCar(slug))
    .filter((c) => c !== undefined)
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      price: formatLakh(c.startingPrice),
      image: c.image.src,
      tagline: c.segment === "electric" ? "Electric SUV" : [...c.fuels].join(" · "),
    }));

  const spotlight = getCar(colourSpotlight)!;
  const suvs = cars.filter((c) => c.segment === "suv").sort(byPrice);
  const evs = cars.filter((c) => c.segment === "electric").sort(byPrice);
  const sortedTrucks = [...trucks].sort(byPrice);
  const testimonials = featuredTestimonials.map((n) => dealer.testimonials.find((t) => t.name === n)).filter((t) => t !== undefined);
  const deliveries = dealer.gallery.find((g) => g.id === "delivering-happiness")?.images.filter(isMedia) ?? [];
  const showroomPhotos = dealer.gallery.find((g) => g.id === "showroom-images")?.images.filter(isMedia) ?? [];
  const servicePhotos = dealer.service.gallery.filter(isMedia);
  const serviceHero = servicePhotos.find((p) => p.src.includes("9086")) ?? servicePhotos[0];
  // The dealership's own delivery-event video (first in the "Other" category on the source site).
  const deliveryVideo = dealer.videos.find((v) => v.category === "Other");

  const grid = (children: React.ReactNode) => <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;

  return (
    <>
      {/* ───────────────────────────── Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(70%_60%_at_70%_0%,white,transparent_70%)]" />
        <div className="container-x relative grid items-center gap-10 pb-12 pt-8 md:pt-12 lg:grid-cols-12 lg:gap-12 lg:pb-16">
          <div className="lg:col-span-5 xl:pr-4">
            <p className="eyebrow animate-rise flex items-center gap-2">
              <span aria-hidden className="h-px w-6 bg-accent" /> Authorised Mahindra dealer since {facts.since}
            </p>
            <h1 className="mt-5 animate-rise text-[clamp(2.5rem,1.6rem+3.1vw,4.4rem)] font-[640] leading-[1] tracking-[-0.035em] [animation-delay:60ms] [font-variation-settings:'wdth'_104]">
              Every Mahindra.{" "}
              <span className="text-muted">One trusted dealer.</span>
            </h1>
            <p className="lead mt-6 max-w-xl animate-rise [animation-delay:120ms]">
              Explore SUVs, electric SUVs and commercial vehicles with published ex-showroom prices, test drive at any of our {facts.showroomCount} showrooms, and keep your vehicle at its best at our {facts.workshopCount} workshops across Ahmedabad, Sanand and Surendranagar.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 animate-rise [animation-delay:180ms]">
              <ButtonLink href="/cars" variant="dark" size="lg">
                Explore SUVs <ArrowRight aria-hidden className="size-4 transition-transform group-hover/btn:translate-x-0.5" />
              </ButtonLink>
              <ButtonLink href="/test-drive" variant="secondary" size="lg">Book a test drive</ButtonLink>
            </div>
          </div>
          <div className="animate-rise [animation-delay:100ms] lg:col-span-7">
            <HeroStage models={hero} />
          </div>
        </div>

        <div className="container-x relative pb-4">
          <dl className="grid grid-cols-2 gap-6 border-t border-line pt-8 md:grid-cols-4">
            {[
              [facts.since, "Serving customers since"],
              [facts.customers, "Customers served"],
              [String(facts.showroomCount), "Showrooms"],
              [String(facts.workshopCount), "Authorised workshops"],
            ].map(([v, l]) => (
              <div key={l} className="flex flex-col-reverse">
                <dt className="mt-1 text-sm text-muted">{l}</dt>
                <dd className="font-display text-3xl font-semibold tracking-tight [font-variation-settings:'wdth'_112] md:text-4xl">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ───────────────────────────── Quick actions */}
      <section aria-label="Quick actions" className="container-x mt-10">
        <QuickActions />
      </section>

      {/* ───────────────────────────── Range */}
      <section aria-labelledby="range-title" className="container-x mt-24 md:mt-32">
        <SectionHeader
          id="range-title"
          eyebrow="The range"
          title="Pick a Mahindra to start"
          lead="Every model we sell, with the ex-showroom price it starts at in Ahmedabad. Open any model for variants, colours and specifications."
          action={<TextLink href="/cars">Compare all SUVs</TextLink>}
        />
        <Tabs
          className="mt-8"
          label="Vehicle categories"
          tabs={[
            { id: "suv", label: "SUVs", count: suvs.length, panel: grid(suvs.map((c, i) => <VehicleCard key={c.slug} kind="car" car={c} priority={i < 3} />)) },
            { id: "ev", label: "Electric SUVs", count: evs.length, panel: grid(evs.map((c) => <VehicleCard key={c.slug} kind="car" car={c} />)) },
            { id: "commercial", label: "Commercial", count: sortedTrucks.length, panel: grid(sortedTrucks.map((t) => <VehicleCard key={t.slug} kind="truck" truck={t} />)) },
          ]}
        />
      </section>

      {/* ───────────────────────────── Colour spotlight */}
      <section aria-labelledby="colour-title" className="container-x mt-24 md:mt-32">
        <div className="reveal grid items-center gap-10 overflow-hidden rounded-[var(--radius-stage)] border border-line bg-surface p-6 shadow-card md:p-10 lg:grid-cols-12 lg:p-14">
          <div className="lg:col-span-4">
            <p className="eyebrow">Colour studio</p>
            <h2 id="colour-title" className="heading-lg mt-3">
              See the {spotlight.name} in all {spotlight.colors.length} colours
            </h2>
            <p className="mt-4 leading-relaxed text-ink-2">
              Every model page lets you preview the colours listed for it. Colours on screen are a guide — see the real paint at the showroom before you choose.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={`/cars/${spotlight.slug}`} variant="dark">Explore {spotlight.name}</ButtonLink>
              <ButtonLink href={`/test-drive?model=${spotlight.slug}`} variant="secondary">Test drive</ButtonLink>
            </div>
          </div>
          <ColourStage
            className="lg:col-span-8"
            model={spotlight.fullName}
            colours={spotlight.colors.filter((c) => isMedia(c.image)).map((c) => ({ name: c.name, hex: c.hex, src: c.image!.src }))}
          />
        </div>
      </section>

      {/* ───────────────────────────── About / trust */}
      <section aria-labelledby="about-title" className="container-x mt-24 md:mt-32">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="reveal relative lg:col-span-6">
            <div className="grid aspect-[5/4] grid-cols-6 grid-rows-6 gap-3">
              {showroomPhotos[0] && (
                <div className="relative col-span-4 row-span-6 overflow-hidden rounded-[var(--radius-card)]">
                  <Image src={showroomPhotos[0].src} alt="Inside a Shital Motors showroom" fill sizes="(min-width: 1024px) 30vw, 66vw" className="object-cover" />
                </div>
              )}
              {deliveries[0] && (
                <div className="relative col-span-2 row-span-3 overflow-hidden rounded-[var(--radius-card)]">
                  <Image src={deliveries[0].src} alt="A family taking delivery of their new Mahindra at Shital Motors" fill sizes="(min-width: 1024px) 15vw, 33vw" className="object-cover" />
                </div>
              )}
              {deliveries[6] && (
                <div className="relative col-span-2 row-span-3 overflow-hidden rounded-[var(--radius-card)]">
                  <Image src={deliveries[6].src} alt="A customer receiving the keys to their new vehicle" fill sizes="(min-width: 1024px) 15vw, 33vw" className="object-cover" />
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col justify-center lg:col-span-6">
            <p className="eyebrow">About Shital Motors</p>
            <h2 id="about-title" className="heading-lg mt-3">One of Gujarat&apos;s longest-standing Mahindra partners</h2>
            <p className="lead mt-5">
              We are an authorised channel partner of Mahindra &amp; Mahindra for personal and commercial vehicles, with 3S facilities — sales, service and spares. We aim for customer delight and believe in absolute transparency.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-6 border-t border-line pt-6">
              <Stat value={facts.customers} label="Customers served" />
              <Stat value={`${showrooms.length + workshops.length}`} label="Showrooms & workshops" />
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              <TextLink href="/about">Our story and awards</TextLink>
              <TextLink href="/testimonials">What customers say</TextLink>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────── Service */}
      <section aria-labelledby="service-title" className="mt-24 bg-surface py-20 md:mt-32 md:py-28">
        <div className="container-x">
          <SectionHeader
            id="service-title"
            eyebrow="Service"
            title="Authorised Mahindra service, four workshops"
            lead="Genuine expertise for your SUV or commercial vehicle — from a 90-minute Qwik Service to body repair estimated with Mahindra's electronic estimation system."
            action={<ButtonLink href="/service#book" variant="primary">Book a service</ButtonLink>}
          />
          <div className="mt-10 grid gap-5 lg:grid-cols-12">
            <ul className="grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-2 lg:col-span-7">
              {dealer.service.offerings.map((o) => (
                <li key={o.title} className="bg-surface p-6">
                  <p className="font-display font-semibold [font-variation-settings:'wdth'_110]">{o.title}</p>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{o.text}</p>
                </li>
              ))}
            </ul>
            <div className="reveal relative min-h-72 overflow-hidden rounded-[var(--radius-card)] lg:col-span-5">
              {serviceHero && <Image src={serviceHero.src} alt="Service reception at a Shital Motors workshop" fill sizes="(min-width: 1024px) 40vw, 92vw" className="object-cover" />}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/85 to-transparent p-6 pt-20 text-white">
                <p className="text-sm text-white/75">Service bookings, Ahmedabad</p>
                <a href={telHref(dealer.contact.serviceBookingPhone ?? dealer.contact.servicePhones[0])} className="tabular mt-1 inline-flex items-center gap-2 font-display text-2xl font-semibold [font-variation-settings:'wdth'_112]">
                  <Phone aria-hidden className="size-5" /> {formatPhone(dealer.contact.serviceBookingPhone ?? dealer.contact.servicePhones[0])}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────── Testimonials */}
      <section aria-labelledby="voices-title" className="mt-24 md:mt-32">
        <div className="container-x">
          <SectionHeader
            id="voices-title"
            eyebrow="Testimonials"
            title="In our customers' words"
            lead={`${dealer.testimonials.length} customers have shared their experience with us — here are a few, unedited.`}
            action={<TextLink href="/testimonials">Read all testimonials</TextLink>}
          />
        </div>
        <div role="region" aria-label="Featured testimonials" tabIndex={0} className="scrollbar-none mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-5 px-5 pb-4 md:scroll-px-8 md:px-8 xl:px-[max(2.5rem,calc((100vw-82rem)/2+2.5rem))]">
          {testimonials.map((t) => (
            <TestimonialCard key={t.name} t={t} clamp className="w-[85vw] max-w-sm shrink-0 snap-start" />
          ))}
        </div>
      </section>

      {/* ───────────────────────────── Locations */}
      <section aria-labelledby="locations-title" className="container-x mt-24 md:mt-32">
        <div className="grid gap-10 rounded-[var(--radius-stage)] border border-line bg-surface p-6 shadow-card md:p-10 lg:grid-cols-12 lg:p-12">
          <div className="lg:col-span-5">
            <p className="eyebrow">Showrooms & workshops</p>
            <h2 id="locations-title" className="heading-lg mt-3">Close to you, across three cities</h2>
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {showrooms.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-4 py-3">
                  <span>
                    <span className="block font-medium">{o.area}</span>
                    <span className="block text-sm text-muted">{o.city} · Showroom</span>
                  </span>
                  <a href={telHref(o.phones[0])} className="tabular shrink-0 text-sm font-medium text-ink-2 hover:text-accent">{formatPhone(o.phones[0])}</a>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <ButtonLink href="/locations" variant="dark">All outlets, hours & directions</ButtonLink>
            </div>
          </div>
          <div className="lg:col-span-7">
            <OutletMap
              className="rounded-[var(--radius-card)] bg-canvas p-4"
              points={outlets.filter((o) => o.geo).map((o) => ({ id: o.id, label: o.area, kind: o.kind, lat: o.geo!.lat, lng: o.geo!.lng, city: o.city }))}
            />
          </div>
        </div>
      </section>

      {/* ───────────────────────────── Deliveries + video */}
      <section aria-labelledby="moments-title" className="container-x mt-24 md:mt-32">
        <SectionHeader id="moments-title" eyebrow="Delivering happiness" title="Moments from our showrooms" action={<TextLink href="/gallery">Gallery & videos</TextLink>} />
        <div className="mt-10 grid gap-4 md:grid-cols-12">
          <div className="grid grid-cols-2 gap-4 md:col-span-7">
            {deliveries.slice(1, 5).map((img, i) => (
              <div key={img.src} className="reveal relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)]">
                <Image src={img.src} alt={`Customer delivery at Shital Motors (${i + 1})`} fill sizes="(min-width: 768px) 28vw, 45vw" className="object-cover transition-transform duration-700 hover:scale-105" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-4 md:col-span-5">
            {dealer.service.videos[0] && (
              <YouTubeLite id={dealer.service.videos[0].id} title={dealer.service.videos[0].title.replace(/^SHITAL MOTORS PVT LTD-/, "")} thumb={dealer.service.videos[0].thumb?.src ?? null} />
            )}
            {deliveryVideo && <YouTubeLite id={deliveryVideo.id} title={deliveryVideo.title} thumb={deliveryVideo.thumb?.src ?? null} />}
          </div>
        </div>
      </section>

      {/* ───────────────────────────── Assistance */}
      <section aria-labelledby="help-title" className="container-x mt-24 md:mt-32">
        <div className="relative overflow-hidden rounded-[var(--radius-stage)] bg-ink px-6 py-12 text-white md:px-12 md:py-16">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-accent/25 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <p className="eyebrow text-white/60">Need personal assistance?</p>
              <h2 id="help-title" className="heading-lg mt-3">Talk to us — or ask Shital Assist</h2>
              <p className="mt-4 max-w-lg leading-relaxed text-white/75">
                Our assistant answers questions about models, prices and outlets instantly, using the information on this site. For anything else, our team is a call away.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <AskAssistantButton className="bg-white text-ink hover:bg-white/90">
                  <Sparkles aria-hidden className="size-4" /> Ask Shital Assist
                </AskAssistantButton>
                <ButtonLink href="/contact" variant="ghost" className="text-white ring-1 ring-white/25 hover:bg-white/10">Contact form</ButtonLink>
              </div>
            </div>
            <dl className="grid gap-6 sm:grid-cols-2 lg:col-span-6">
              <div className="rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10">
                <dt className="flex items-center gap-2 text-sm text-white/60"><Phone aria-hidden className="size-4" /> Sales</dt>
                <dd className="mt-2 space-y-1">
                  {dealer.contact.salesPhones.map((p) => (
                    <a key={p} href={telHref(p)} className="tabular block font-display text-xl font-semibold hover:text-white/80">{formatPhone(p)}</a>
                  ))}
                </dd>
              </div>
              <div className="rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10">
                <dt className="flex items-center gap-2 text-sm text-white/60"><Phone aria-hidden className="size-4" /> Service</dt>
                <dd className="mt-2 space-y-1">
                  {dealer.contact.servicePhones.map((p) => (
                    <a key={p} href={telHref(p)} className="tabular block font-display text-xl font-semibold hover:text-white/80">{formatPhone(p)}</a>
                  ))}
                </dd>
              </div>
              <div className="rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10">
                <dt className="flex items-center gap-2 text-sm text-white/60"><Mail aria-hidden className="size-4" /> Email</dt>
                <dd className="mt-2 break-all"><a href={`mailto:${dealer.contact.email}`} className="font-medium hover:text-white/80">{dealer.contact.email}</a></dd>
              </div>
              <div className="rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10">
                <dt className="flex items-center gap-2 text-sm text-white/60"><Clock aria-hidden className="size-4" /> Working hours</dt>
                <dd className="mt-2 font-medium">{dealer.contact.hours?.replace(" to ", " – ")}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>
    </>
  );
}
