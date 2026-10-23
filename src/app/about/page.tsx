import type { Metadata } from "next";
import Image from "next/image";
import { dealer, isMedia, showrooms, workshops } from "@/lib/content";
import { facts } from "@/lib/site";
import { awardCaptions } from "@/content/curation";
import { PageHero, SectionHeader, Stat, TextLink } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { LightboxGallery } from "@/components/media/lightbox-gallery";
import { breadcrumbLd, JsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "About Shital Motors — Authorised Mahindra Dealer since 2004",
  description: `Shital Motors is one of the oldest and leading authorised Mahindra channel partners in Gujarat, with 3S facilities, ${showrooms.length} showrooms and ${workshops.length} workshops, serving more than 2 lakh customers.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const awards = (dealer.gallery.find((g) => g.id === "awards")?.images.filter(isMedia) ?? [])
    .map((img) => ({ img, caption: awardCaptions[img.src.split("/").pop()!.replace(/\.\w+$/, "")] }))
    .filter((a) => a.caption);
  const showroomPhotos = dealer.gallery.find((g) => g.id === "showroom-images")?.images.filter(isMedia) ?? [];

  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "About us" }]}
        eyebrow="About Shital Motors"
        title="Building trust with Mahindra owners since 2004"
        lead="Welcome to Shital Motors — where we aim to make buying and owning a Mahindra a genuinely delightful experience."
      />

      <section className="container-x pt-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="space-y-5 text-[1.05rem] leading-relaxed text-ink-2 lg:col-span-7">
            <p>
              We are one of the oldest and leading authorised channel partners of Mahindra &amp; Mahindra&apos;s automotive division in Gujarat, for both personal and commercial vehicles, with 3S facilities — sales, service and spares.
            </p>
            <p>
              Today we serve customers through {showrooms.length} showrooms and {workshops.length} workshops across {facts.cities.join(", ").replace(/, ([^,]*)$/, " and $1")}.
            </p>
            <p>
              We have served more than 2 lakh satisfied customers and carry a strong reputation with them — a sense of <strong className="font-semibold text-ink">trust</strong> we have built right from our inception. We aim for customer delight by exceeding expectations, and we believe in absolute transparency.
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-3 pt-3">
              <TextLink href="/locations">Visit a showroom</TextLink>
              <TextLink href="/testimonials">Read customer testimonials</TextLink>
              <TextLink href="/careers">Work with us</TextLink>
            </div>
          </div>
          <div className="grid grid-cols-2 content-start gap-8 rounded-[var(--radius-card)] border border-line bg-surface p-8 shadow-xs lg:col-span-5">
            <Stat value={facts.since} label="Serving customers since" />
            <Stat value={facts.customers} label="Customers served" />
            <Stat value={showrooms.length} label="Showrooms" />
            <Stat value={workshops.length} label="Workshops" />
          </div>
        </div>
      </section>

      {showroomPhotos.length > 0 && (
        <section aria-labelledby="showrooms-title" className="container-x pt-24">
          <SectionHeader id="showrooms-title" eyebrow="Our showrooms" title="Spaces designed around you" action={<TextLink href="/gallery">Full gallery</TextLink>} />
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2">
            {showroomPhotos.slice(0, 5).map((p, i) => (
              <div key={p.src} className={`reveal relative overflow-hidden rounded-[var(--radius-card)] ${i === 0 ? "col-span-2 row-span-2 aspect-square md:aspect-auto" : "aspect-[4/3]"}`}>
                <Image src={p.src} alt={`Inside a Shital Motors showroom (${i + 1})`} fill sizes={i === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 768px) 25vw, 50vw"} className="object-cover" />
              </div>
            ))}
          </div>
        </section>
      )}

      {awards.length > 0 && (
        <section aria-labelledby="awards-title" className="container-x pt-24">
          <SectionHeader id="awards-title" eyebrow="Recognition" title="Awards and recognition" lead="A selection of awards presented to Shital Motors, as photographed in our gallery." />
          <LightboxGallery className="mt-10" images={awards.map((a) => ({ src: a.img.src, alt: a.caption!, caption: a.caption }))} />
        </section>
      )}

      {dealer.aboutImage && (
        <section className="container-x pt-24">
          <div className="relative overflow-hidden rounded-[var(--radius-stage)] bg-ink text-white">
            <Image src={dealer.aboutImage.src} alt="" fill sizes="100vw" className="object-cover opacity-35" />
            <div className="relative px-6 py-16 md:px-14 md:py-20">
              <h2 className="heading-lg max-w-xl">Find the right Mahindra with people who know it</h2>
              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href="/test-drive" variant="primary" size="lg">Book a test drive</ButtonLink>
                <ButtonLink href="/cars" variant="light" size="lg">Explore SUVs</ButtonLink>
              </div>
            </div>
          </div>
        </section>
      )}
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
    </>
  );
}
