"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { VehicleTile, type TileData } from "./vehicle-card";

export type ExplorerItem = TileData & {
  slug: string;
  segment: "suv" | "electric";
  fuels: string[];
  transmissions: string[];
  seats: number[];
  from: number;
};

type Filters = { segment: "all" | "suv" | "electric"; fuel: string | null; transmission: string | null; seats7: boolean; budget: number; sort: "price-asc" | "price-desc" | "name" };

const lakh = (n: number) => `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} lakh`;

export function ModelExplorer({ items }: { items: ExplorerItem[] }) {
  const params = useSearchParams();
  const maxPrice = Math.ceil(Math.max(...items.map((i) => i.from)) / 100000) * 100000;
  const initialSegment = (params.get("segment") as Filters["segment"]) ?? "all";
  const defaults: Filters = { segment: "all", fuel: null, transmission: null, seats7: false, budget: maxPrice, sort: "price-asc" };
  const [f, setF] = useState<Filters>({ ...defaults, segment: ["suv", "electric"].includes(initialSegment) ? initialSegment : "all" });

  // Keep the segment in the URL so filtered views can be shared.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (f.segment === "all") url.searchParams.delete("segment");
    else url.searchParams.set("segment", f.segment);
    window.history.replaceState(null, "", url);
  }, [f.segment]);

  const fuels = useMemo(() => [...new Set(items.flatMap((i) => i.fuels))], [items]);
  const results = useMemo(() => {
    const list = items.filter(
      (i) =>
        (f.segment === "all" || i.segment === f.segment) &&
        (!f.fuel || i.fuels.includes(f.fuel)) &&
        (!f.transmission || i.transmissions.includes(f.transmission)) &&
        (!f.seats7 || i.seats.some((s) => s >= 7)) &&
        i.from <= f.budget,
    );
    return list.sort((a, b) => (f.sort === "name" ? a.name.localeCompare(b.name) : f.sort === "price-desc" ? b.from - a.from : a.from - b.from));
  }, [items, f]);

  const dirty = JSON.stringify(f) !== JSON.stringify(defaults);
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="grid gap-8 lg:grid-cols-[17rem_1fr] lg:gap-10">
      <aside aria-label="Filters" className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 font-medium">
              <SlidersHorizontal aria-hidden className="size-4" /> Filters
            </p>
            {dirty && (
              <button type="button" onClick={() => setF(defaults)} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
                <RotateCcw aria-hidden className="size-3.5" /> Reset
              </button>
            )}
          </div>

          <FilterGroup label="Type">
            <Segmented
              name="segment"
              value={f.segment}
              onChange={(v) => set("segment", v as Filters["segment"])}
              options={[
                ["all", "All"],
                ["suv", "SUV"],
                ["electric", "Electric"],
              ]}
            />
          </FilterGroup>

          <FilterGroup label="Fuel">
            <Chips value={f.fuel} onChange={(v) => set("fuel", v)} options={fuels} />
          </FilterGroup>

          <FilterGroup label="Transmission">
            <Chips value={f.transmission} onChange={(v) => set("transmission", v)} options={["Manual", "Automatic"]} />
          </FilterGroup>

          <FilterGroup label="Seating">
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input type="checkbox" checked={f.seats7} onChange={(e) => set("seats7", e.target.checked)} className="size-4 accent-[var(--color-accent)]" />
              7 or more seats available
            </label>
          </FilterGroup>

          <FilterGroup label="Starting price up to">
            <div className="flex items-baseline justify-between text-sm">
              <output htmlFor="budget" className="tabular font-medium">{f.budget >= maxPrice ? "Any" : lakh(f.budget)}</output>
            </div>
            <input
              id="budget"
              type="range"
              min={700000}
              max={maxPrice}
              step={50000}
              value={f.budget}
              onChange={(e) => set("budget", Number(e.target.value))}
              aria-label="Maximum starting price"
              aria-valuetext={f.budget >= maxPrice ? "Any price" : lakh(f.budget)}
              className="mt-3 w-full accent-[var(--color-ink)]"
            />
            <div className="tabular mt-1 flex justify-between text-xs text-subtle">
              <span>₹7 lakh</span>
              <span>{lakh(maxPrice)}</span>
            </div>
          </FilterGroup>
        </div>
      </aside>

      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted" aria-live="polite">
            Showing <span className="font-medium text-ink">{results.length}</span> of {items.length} models
          </p>
          <label className="flex items-center gap-2 text-sm text-muted">
            Sort
            <select value={f.sort} onChange={(e) => set("sort", e.target.value as Filters["sort"])} className="rounded-full border border-line-strong bg-surface px-3 py-1.5 text-ink">
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>
        {results.length ? (
          <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((item, i) => (
              <li key={item.slug} className="animate-fade-in">
                <VehicleTile data={item} priority={i < 3} sizes="(min-width: 1280px) 26vw, (min-width: 640px) 40vw, 92vw" />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong p-12 text-center">
            <p className="font-medium">No models match these filters.</p>
            <button type="button" onClick={() => setF(defaults)} className="mt-3 text-sm font-medium text-accent-strong underline underline-offset-4">
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-6 border-t border-line pt-5">
      <legend className="eyebrow float-left mb-3 w-full">{label}</legend>
      <div className="clear-both">{children}</div>
    </fieldset>
  );
}

function Segmented({ name, value, onChange, options }: { name: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-full bg-sunken p-1">
      {options.map(([v, l]) => (
        <label key={v} className={`cursor-pointer rounded-full py-1.5 text-center text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${value === v ? "bg-surface font-medium text-ink shadow-xs" : "text-muted hover:text-ink"}`}>
          <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} className="sr-only" />
          {l}
        </label>
      ))}
    </div>
  );
}

function Chips({ value, onChange, options }: { value: string | null; onChange: (v: string | null) => void; options: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(value === o ? null : o)}
          className={`rounded-full px-3 py-1.5 text-sm transition-colors ${value === o ? "bg-ink text-white" : "bg-sunken text-ink-2 hover:text-ink"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
