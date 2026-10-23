"use client";

import { useId, useState } from "react";
import type { SpecGroup } from "@/lib/content";

const UNIT_HINTS: Record<string, (v: string) => string> = {
  Displacement: (v) => (/^\d+$/.test(v) ? `${v} cc` : v),
  "Fuel Tank Capacity": (v) => (/^\d+(\.\d+)?$/.test(v) ? `${parseFloat(v)} L` : v),
};

export function SpecSheet({ variants }: { variants: { name: string; groups: SpecGroup[] }[] }) {
  const [index, setIndex] = useState(0);
  const id = useId();
  const current = variants[index];
  if (!current) return null;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <label htmlFor={id} className="text-sm text-muted">Specifications for</label>
        <select id={id} value={index} onChange={(e) => setIndex(Number(e.target.value))} className="w-full rounded-full border border-line-strong bg-surface px-4 py-2.5 text-sm font-medium sm:w-auto">
          {variants.map((v, i) => (
            <option key={`${v.name}-${i}`} value={i}>{v.name}</option>
          ))}
        </select>
      </div>
      <div key={index} className="grid animate-fade-in gap-5 md:grid-cols-2">
        {current.groups.map((g) => (
          <section key={g.title} className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-xs">
            <h3 className="eyebrow mb-3">{g.title}</h3>
            <dl className="divide-y divide-line">
              {g.items.map((item) => (
                <div key={item.label} className="flex items-baseline justify-between gap-6 py-2.5 text-sm">
                  <dt className="text-muted">{item.label}</dt>
                  <dd className="tabular text-right font-medium text-ink">{UNIT_HINTS[item.label]?.(item.value) ?? item.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </div>
  );
}
