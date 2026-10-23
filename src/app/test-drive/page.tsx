import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/ui/primitives";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { formOptions } from "@/lib/form-options";

export const metadata: Metadata = {
  title: "Book a test drive",
  description: "Book a Mahindra test drive at a Shital Motors showroom in Ahmedabad, Sanand or Surendranagar.",
  alternates: { canonical: "/test-drive" },
};

export default function Page() {
  const options = formOptions();
  return (
    <>
      <PageHero breadcrumbs={[{ label: "Home", href: "/" }, { label: "Test drive" }]} eyebrow="Test drive" title="Book a test drive" lead="Choose a model and the showroom that suits you. Our team will call to confirm a convenient time." />
      <section className="container-x mt-10">
        {/* The form reads ?model= from the URL, so it renders inside Suspense; the fallback keeps layout stable. */}
        <Suspense fallback={<div className="h-[34rem] animate-pulse rounded-[var(--radius-card)] bg-surface" />}>
          <EnquiryForm kind="test-drive" options={options} />
        </Suspense>
      </section>
    </>
  );
}
