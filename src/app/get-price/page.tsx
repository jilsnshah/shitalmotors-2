import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHero } from "@/components/ui/primitives";
import { EnquiryForm } from "@/components/forms/enquiry-form";
import { formOptions } from "@/lib/form-options";

export const metadata: Metadata = {
  title: "Get the on-road price",
  description: "Request the on-road price of any Mahindra SUV or commercial vehicle from Shital Motors.",
  alternates: { canonical: "/get-price" },
};

export default function Page() {
  const options = formOptions();
  return (
    <>
      <PageHero breadcrumbs={[{ label: "Home", href: "/" }, { label: "On-road price" }]} eyebrow="On-road price" title="Get the on-road price" lead="Ex-showroom prices are listed on every model page. For the on-road price — including registration, insurance and any applicable charges — tell us the model and your nearest showroom." />
      <section className="container-x mt-10">
        {/* The form reads ?model= from the URL, so it renders inside Suspense; the fallback keeps layout stable. */}
        <Suspense fallback={<div className="h-[34rem] animate-pulse rounded-[var(--radius-card)] bg-surface" />}>
          <EnquiryForm kind="price" options={options} />
        </Suspense>
      </section>
    </>
  );
}
