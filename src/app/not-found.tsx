import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="container-x flex min-h-[60vh] flex-col items-start justify-center py-24">
      <p className="eyebrow">Error 404</p>
      <h1 className="display-lg mt-4 max-w-2xl">This road doesn&apos;t go anywhere.</h1>
      <p className="lead mt-5 max-w-xl">The page you&apos;re looking for may have moved when we rebuilt our website.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/" variant="dark">Back to home</ButtonLink>
        <ButtonLink href="/cars" variant="secondary">Explore SUVs</ButtonLink>
      </div>
      <p className="mt-10 text-sm text-muted">
        Need help? <Link href="/contact" className="font-medium text-ink underline underline-offset-4">Contact us</Link>.
      </p>
    </section>
  );
}
