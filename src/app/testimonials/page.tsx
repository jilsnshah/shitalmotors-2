import type { Metadata } from "next";
import { dealer } from "@/lib/content";
import { testimonialBranches } from "@/content/curation";
import { PageHero } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import { TestimonialWall } from "@/components/testimonials/testimonial-wall";
import { breadcrumbLd, JsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Customer Testimonials",
  description: `${dealer.testimonials.length} customers share their experience of buying and servicing their Mahindra with Shital Motors.`,
  alternates: { canonical: "/testimonials" },
};

export default function TestimonialsPage() {
  const items = dealer.testimonials.map((t) => ({ ...t, branches: testimonialBranches.filter((b) => b.match.test(t.text)).map((b) => b.label) }));
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Testimonials" }]}
        eyebrow="Testimonials"
        title="In our customers' own words"
        lead="Shared with us by customers after their delivery or service — published as written, including in Gujarati and Hindi."
      >
        <ButtonLink href="/contact" variant="secondary">Share your feedback</ButtonLink>
      </PageHero>
      <section className="container-x mt-10">
        <TestimonialWall items={items} branches={testimonialBranches.map((b) => b.label).filter((b) => items.some((t) => t.branches.includes(b)))} />
      </section>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Testimonials", path: "/testimonials" }])} />
    </>
  );
}
