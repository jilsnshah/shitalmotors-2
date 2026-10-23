"use client";

import { useState } from "react";
import type { Testimonial } from "@/lib/content";
import { TestimonialCard } from "./testimonial-card";

export function TestimonialWall({ items, branches }: { items: (Testimonial & { branches: string[] })[]; branches: string[] }) {
  const [branch, setBranch] = useState<string | null>(null);
  const visible = branch ? items.filter((t) => t.branches.includes(branch)) : items;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by branch mentioned">
        <span className="mr-1 text-sm text-muted">Mentions</span>
        {[null, ...branches].map((b) => (
          <button
            key={b ?? "all"}
            type="button"
            aria-pressed={branch === b}
            onClick={() => setBranch(b)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${branch === b ? "bg-ink text-white" : "bg-surface text-ink-2 ring-1 ring-line hover:text-ink"}`}
          >
            {b ?? "All"} <span className={`tabular ${branch === b ? "text-white/80" : "text-muted"}`}>{b ? items.filter((t) => t.branches.includes(b)).length : items.length}</span>
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">{visible.length} testimonials shown</p>
      <div className="mt-8 columns-1 gap-5 md:columns-2 lg:columns-3 [&>*]:mb-5 [&>*]:break-inside-avoid">
        {visible.map((t) => (
          <TestimonialCard key={t.name + t.text.slice(0, 20)} t={t} />
        ))}
      </div>
    </div>
  );
}
