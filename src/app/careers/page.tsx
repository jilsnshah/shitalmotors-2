import type { Metadata } from "next";
import { PageHero } from "@/components/ui/primitives";
import { CareersForm } from "@/components/forms/careers-form";
import { dealer } from "@/lib/content";
import { formatPhone, telHref } from "@/lib/format";

export const metadata: Metadata = {
  title: "Careers",
  description: "Send your resume to Shital Motors, an authorised Mahindra dealer with showrooms and workshops across Ahmedabad, Sanand and Surendranagar.",
  alternates: { canonical: "/careers" },
};

export default function CareersPage() {
  const phone = dealer.contact.salesPhones[0];
  return (
    <>
      <PageHero
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Careers" }]}
        eyebrow="Careers"
        title="Work with Shital Motors"
        lead="Interested in sales, service or customer care at an authorised Mahindra dealership? Send us your resume and we'll be in touch when there's a suitable opening."
      />
      <section className="container-x mt-10 max-w-3xl">
        <CareersForm phone={{ display: formatPhone(phone), href: telHref(phone) }} />
      </section>
    </>
  );
}
