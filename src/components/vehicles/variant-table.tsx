"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FileDown, ArrowRight } from "lucide-react";

export type VariantRow = {
  name: string;
  fuel: string | null;
  transmission: string | null;
  engine: string | null;
  battery: string | null;
  power: string | null;
  gvw?: string | null;
  price: string | null;
  priceValue: number | null;
  brochure: string | null;
};

export function VariantTable({ rows, modelSlug, kind = "car" }: { rows: VariantRow[]; modelSlug: string; kind?: "car" | "truck" }) {
  const fuels = useMemo(() => [...new Set(rows.map((r) => r.fuel).filter(Boolean))] as string[], [rows]);
  const transmissions = useMemo(() => [...new Set(rows.map((r) => r.transmission).filter(Boolean))] as string[], [rows]);
  const [fuel, setFuel] = useState<string | null>(null);
  const [trans, setTrans] = useState<string | null>(null);
  const [sortDesc, setSortDesc] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const LIMIT = 8;

  const visible = useMemo(
    () =>
      rows
        .filter((r) => (!fuel || r.fuel === fuel) && (!trans || r.transmission === trans))
        .sort((a, b) => ((a.priceValue ?? Infinity) - (b.priceValue ?? Infinity)) * (sortDesc ? -1 : 1)),
    [rows, fuel, trans, sortDesc],
  );

  const shown = expanded ? visible : visible.slice(0, LIMIT);
  const hiddenCount = visible.length - shown.length;

  const hasEngine = rows.some((r) => r.engine);
  const hasBattery = rows.some((r) => r.battery);
  const hasGvw = rows.some((r) => r.gvw);
  const hasTrans = rows.some((r) => r.transmission);
  const priceHref = (variant: string) => `/get-price?model=${modelSlug}&variant=${encodeURIComponent(variant)}`;

  return (
    <div>
      {(fuels.length > 1 || transmissions.length > 1) && (
        <div className="mb-5 flex flex-wrap items-center gap-2" role="group" aria-label="Filter variants">
          {fuels.length > 1 && <ChipRow label="Fuel" options={fuels} value={fuel} onChange={setFuel} />}
          {transmissions.length > 1 && <ChipRow label="Transmission" options={transmissions} value={trans} onChange={setTrans} />}
        </div>
      )}
      <p className="sr-only" aria-live="polite">{visible.length} variants shown</p>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-xs md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-sunken/60 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-5 py-3.5 font-medium">Variant</th>
              {hasTrans && <th scope="col" className="px-4 py-3.5 font-medium">Transmission</th>}
              {hasEngine && <th scope="col" className="px-4 py-3.5 font-medium">Engine</th>}
              {hasBattery && <th scope="col" className="px-4 py-3.5 font-medium">Battery</th>}
              <th scope="col" className="px-4 py-3.5 font-medium">Power</th>
              {hasGvw && <th scope="col" className="px-4 py-3.5 font-medium">GVW</th>}
              <th scope="col" aria-sort={sortDesc ? "descending" : "ascending"} className="px-4 py-3.5 text-right font-medium">
                <button type="button" onClick={() => setSortDesc((v) => !v)} className="inline-flex items-center gap-1 uppercase hover:text-ink">
                  Ex-showroom <span aria-hidden>{sortDesc ? "↓" : "↑"}</span>
                  <span className="sr-only">, sort {sortDesc ? "low to high" : "high to low"}</span>
                </button>
              </th>
              <th scope="col" className="px-5 py-3.5"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {shown.map((r) => (
              <tr key={r.name} className="group transition-colors hover:bg-canvas">
                <th scope="row" className="px-5 py-4 font-medium text-ink">
                  {r.name}
                  {r.fuel && <span className="ml-2 rounded-full bg-sunken px-2 py-0.5 text-xs font-normal text-muted">{r.fuel}</span>}
                </th>
                {hasTrans && <td className="px-4 py-4 text-ink-2">{r.transmission ?? "—"}</td>}
                {hasEngine && <td className="tabular px-4 py-4 text-ink-2">{r.engine?.replace(" CC", " cc") ?? "—"}</td>}
                {hasBattery && <td className="tabular px-4 py-4 text-ink-2">{r.battery ?? "—"}</td>}
                <td className="tabular px-4 py-4 text-ink-2">{r.power ?? "—"}</td>
                {hasGvw && <td className="tabular px-4 py-4 text-ink-2">{r.gvw ?? "—"}</td>}
                <td className="tabular px-4 py-4 text-right font-display text-base font-semibold [font-variation-settings:'wdth'_106]">{r.price ?? <span className="text-sm font-normal text-muted">On request</span>}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {r.brochure && (
                      <a href={r.brochure} target="_blank" rel="noopener noreferrer" className="grid size-8 place-items-center rounded-full text-muted hover:bg-sunken hover:text-ink" aria-label={`Brochure for ${r.name} (PDF)`} title="Brochure (PDF)">
                        <FileDown className="size-4" />
                      </a>
                    )}
                    <Link href={priceHref(r.name)} className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-ink ring-1 ring-line-strong transition-colors hover:bg-ink hover:text-white hover:ring-ink">
                      On-road price <ArrowRight aria-hidden className="size-3" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="grid gap-3 md:hidden">
        {shown.map((r) => (
          <li key={r.name} className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">{r.name}</p>
              <p className="tabular shrink-0 font-display font-semibold">{r.price ?? "On request"}</p>
            </div>
            <p className="mt-1 text-sm text-muted">
              {[r.fuel, r.transmission, r.engine?.replace(" CC", " cc"), r.battery, r.gvw ? `GVW ${r.gvw}` : null].filter(Boolean).join(" · ")}
            </p>
            <div className="mt-3 flex gap-2">
              <Link href={priceHref(r.name)} className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-white">On-road price</Link>
              {r.brochure && (
                <a href={r.brochure} target="_blank" rel="noopener noreferrer" className="rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-line-strong">
                  Brochure (PDF)
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
      {(hiddenCount > 0 || (expanded && visible.length > LIMIT)) && (
        <div className="mt-4 flex justify-center">
          <button type="button" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="rounded-full bg-surface px-5 py-2.5 text-sm font-medium text-ink ring-1 ring-line-strong transition-colors hover:ring-ink/40">
            {expanded ? "Show fewer variants" : `Show all ${visible.length} variants`}
          </button>
        </div>
      )}
      {kind === "car" && (
        <p className="mt-4 text-xs leading-relaxed text-muted">
          Power figures are reproduced as published on the dealership&apos;s current website; please confirm specifications with the brochure or our sales team.
        </p>
      )}
    </div>
  );
}

function ChipRow({ label, options, value, onChange }: { label: string; options: string[]; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-surface p-1 ring-1 ring-line">
      <span className="px-2 text-xs text-muted">{label}</span>
      {[null, ...options].map((o) => (
        <button
          key={o ?? "all"}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={`rounded-full px-3 py-1 text-sm transition-colors ${value === o ? "bg-ink text-white" : "text-ink-2 hover:text-ink"}`}
        >
          {o ?? "All"}
        </button>
      ))}
    </div>
  );
}
