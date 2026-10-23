"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

export type HeroModel = { slug: string; name: string; price: string | null; image: string; tagline: string };

export function HeroStage({ models }: { models: HeroModel[] }) {
  const [active, setActive] = useState(0);
  const m = models[active];

  return (
    <div className="relative">
      <div className="stage relative aspect-[4/3.4] overflow-hidden rounded-[var(--radius-stage)] shadow-lift sm:aspect-[3/2.25]">
        {/* The photo background matches the stage, so the car can sit in the upper area and leave room for the caption. */}
        <div className="absolute inset-x-[2%] bottom-[22%] top-[1%] z-[1]">
        {models.map((model, i) => (
          <Image
            key={model.slug}
            src={model.image}
            alt={i === active ? `Mahindra ${model.name}` : ""}
            aria-hidden={i !== active}
            fill
            fetchPriority={i === 0 ? "high" : "low"}
            loading={i === 0 ? "eager" : "lazy"}
            quality={90}
            sizes="(min-width: 1024px) 56vw, 96vw"
            className={`object-contain transition-[opacity,transform] duration-[900ms] ease-[var(--ease-out-quint)] ${
              i === active ? "translate-x-0 scale-100 opacity-100" : i < active ? "-translate-x-6 scale-[0.98] opacity-0" : "translate-x-6 scale-[0.98] opacity-0"
            }`}
          />
        ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 z-[3] flex items-end justify-between gap-4 p-5 sm:p-7">
          <div key={m.slug} className="animate-rise">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink/60">{m.tagline}</p>
            <p className="mt-1 font-display text-2xl font-semibold tracking-tight [font-variation-settings:'wdth'_114] sm:text-3xl">{m.name}</p>
            {m.price && (
              <p className="tabular mt-0.5 text-sm text-ink-2">
                Ex-showroom from <span className="font-semibold text-ink">{m.price}</span>
              </p>
            )}
          </div>
          <Link
            href={`/cars/${m.slug}`}
            className="group inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-ink text-white shadow-lift transition-transform duration-300 hover:scale-105"
            aria-label={`Explore the ${m.name}`}
          >
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <div role="tablist" aria-label="Featured models" className="scrollbar-none mt-4 flex gap-2 overflow-x-auto">
        {models.map((model, i) => (
          <button
            key={model.slug}
            role="tab"
            type="button"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              i === active ? "bg-ink text-white" : "bg-surface text-ink-2 ring-1 ring-line hover:text-ink hover:ring-line-strong"
            }`}
          >
            {model.name}
          </button>
        ))}
      </div>
    </div>
  );
}
