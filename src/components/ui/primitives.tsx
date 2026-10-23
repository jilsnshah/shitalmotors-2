import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export function Badge({ children, tone = "neutral", className = "" }: { children: ReactNode; tone?: "neutral" | "accent" | "electric" | "success" | "dark"; className?: string }) {
  const tones = {
    neutral: "bg-sunken text-ink-2 ring-line",
    accent: "bg-accent-soft text-accent-strong ring-accent/15",
    electric: "bg-electric-soft text-electric ring-electric/15",
    success: "bg-success-soft text-success ring-success/15",
    dark: "bg-ink text-white ring-ink",
  } as const;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  lead,
  action,
  align = "left",
  id,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  action?: ReactNode;
  align?: "left" | "center";
  id?: string;
}) {
  return (
    <div className={`flex flex-col gap-5 md:flex-row md:items-end md:justify-between ${align === "center" ? "items-center text-center md:flex-col md:items-center" : ""}`}>
      <div className={`max-w-2xl ${align === "center" ? "mx-auto" : ""}`}>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 id={id} className="heading-lg">{title}</h2>
        {lead && <p className="lead mt-4">{lead}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function TextLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={`group inline-flex items-center gap-1 font-medium text-ink ${className}`}>
      <span className="link-underline">{children}</span>
      <ChevronRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
    </Link>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight aria-hidden className="size-3.5 text-subtle" />}
            {item.href ? (
              <Link href={item.href} className="hover:text-ink">{item.label}</Link>
            ) : (
              <span aria-current="page" className="text-ink">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHero({
  eyebrow,
  title,
  lead,
  children,
  breadcrumbs,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  children?: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-surface">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_0%,var(--color-sunken),transparent_70%)]" />
      <div className="container-x relative pb-12 pt-8 md:pb-16 md:pt-10">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        <div className="mt-8 max-w-3xl md:mt-12">
          {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
          <h1 className="display-lg">{title}</h1>
          {lead && <p className="lead mt-5 max-w-2xl">{lead}</p>}
        </div>
        {children && <div className="mt-8">{children}</div>}
      </div>
    </section>
  );
}

export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl font-semibold tracking-tight [font-variation-settings:'wdth'_112] md:text-4xl">{value}</div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </div>
  );
}
