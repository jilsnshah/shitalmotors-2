import { Quote } from "lucide-react";
import type { Testimonial } from "@/lib/content";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

/** Customer words are shown verbatim, as published by the dealership. */
export function TestimonialCard({ t, clamp = false, className = "" }: { t: Testimonial; clamp?: boolean; className?: string }) {
  return (
    <figure className={`flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-xs ${className}`}>
      <Quote aria-hidden className="size-6 text-accent/70" />
      <blockquote className={`mt-4 whitespace-pre-line text-[0.95rem] leading-relaxed text-ink-2 ${clamp ? "line-clamp-6" : ""}`}>{t.text}</blockquote>
      <figcaption className="mt-auto flex items-center gap-3 pt-6">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-sunken font-display text-sm font-semibold text-ink-2">
          {initials(t.name)}
        </span>
        <span>
          <span className="block text-sm font-medium capitalize text-ink">{t.name.toLowerCase()}</span>
          <span className="block text-xs text-muted">{t.city}</span>
        </span>
      </figcaption>
    </figure>
  );
}
