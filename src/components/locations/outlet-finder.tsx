"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Clock, Mail, MapPin, Navigation, Phone, Store, Wrench } from "lucide-react";
import type { Outlet } from "@/lib/content";
import { directionsHref, formatPhone, telHref } from "@/lib/format";
import { openState, summariseHours, type OpenState } from "@/lib/hours";
import { OutletMap } from "./outlet-map";

const currentMinute = () => Math.floor(Date.now() / 60_000);
function subscribeMinute(cb: () => void) {
  const t = setInterval(cb, 15_000);
  return () => clearInterval(t);
}
function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

export function OutletFinder({ outlets }: { outlets: Outlet[] }) {
  const [kind, setKind] = useState<"all" | "showroom" | "workshop">("all");
  const [city, setCity] = useState<string>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const cardRefs = useRef(new Map<string, HTMLElement>());

  // Open/closed depends on the visitor's clock: read it in the browser only, re-rendering each minute.
  const minute = useSyncExternalStore(subscribeMinute, currentMinute, () => null);
  const now = minute === null ? null : new Date(minute * 60_000);

  // Honour /locations#outlet-id deep links until the visitor picks an outlet.
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash.slice(1), () => "");
  const active = selected ?? (outlets.some((o) => o.id === hash) ? hash : null);
  const setActive = setSelected;

  const cities = useMemo(() => [...new Set(outlets.map((o) => o.city))], [outlets]);
  const visible = outlets.filter((o) => (kind === "all" || o.kind === kind) && (city === "all" || o.city === city));
  const points = visible.filter((o) => o.geo).map((o) => ({ id: o.id, label: o.area, kind: o.kind, lat: o.geo!.lat, lng: o.geo!.lng, city: o.city }));

  const select = (id: string) => {
    setActive(id);
    const el = cardRefs.current.get(id);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    el?.focus({ preventScroll: true });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-24">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter outlets">
            {(["all", "showroom", "workshop"] as const).map((k) => (
              <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${kind === k ? "bg-ink text-white" : "bg-surface text-ink-2 ring-1 ring-line hover:text-ink"}`}>
                {k === "all" ? "All outlets" : k === "showroom" ? "Showrooms" : "Workshops"}
              </button>
            ))}
            <label className="ml-auto flex items-center gap-2 text-sm text-muted">
              <span className="sr-only">City</span>
              <select value={city} onChange={(e) => setCity(e.target.value)} className="rounded-full border border-line-strong bg-surface px-3 py-2 text-ink">
                <option value="all">All cities</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          {points.length > 1 && (
            <div className="mt-5 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-xs">
              <OutletMap points={points} activeId={active} onSelect={select} />
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-7">
        <p className="mb-4 text-sm text-muted" aria-live="polite">
          {visible.length} outlet{visible.length === 1 ? "" : "s"}
        </p>
        <ul className="grid gap-4">
          {visible.map((o) => (
            <li key={o.id}>
              <OutletCard
                outlet={o}
                active={active === o.id}
                status={now ? openState(o.hours, now) : null}
                onFocus={() => setActive(o.id)}
                refCallback={(el) => {
                  if (el) cardRefs.current.set(o.id, el);
                  else cardRefs.current.delete(o.id);
                }}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function OutletCard({ outlet: o, active, status, onFocus, refCallback }: { outlet: Outlet; active: boolean; status: OpenState | null; onFocus: () => void; refCallback: (el: HTMLElement | null) => void }) {
  const Icon = o.kind === "workshop" ? Wrench : Store;
  return (
    <article
      id={o.id}
      ref={refCallback}
      tabIndex={-1}
      onMouseEnter={onFocus}
      aria-labelledby={`${o.id}-title`}
      className={`scroll-mt-28 rounded-[var(--radius-card)] border bg-surface p-5 outline-none transition-[border-color,box-shadow] duration-300 md:p-6 ${active ? "border-ink/40 shadow-lift" : "border-line shadow-xs"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${active ? "bg-accent text-white" : "bg-sunken text-ink"} transition-colors`}>
            <Icon aria-hidden className="size-5" />
          </span>
          <div>
            <h3 id={`${o.id}-title`} className="font-display text-lg font-semibold leading-tight [font-variation-settings:'wdth'_108]">{o.area}</h3>
            <p className="text-sm text-muted">
              {o.kind === "workshop" ? "Authorised workshop" : "Showroom"} · {o.city}
            </p>
          </div>
        </div>
        {status && (
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              status.state === "open" ? "bg-success-soft text-success" : status.state === "closed" ? "bg-sunken text-muted" : "bg-warning-soft text-warning"
            }`}
          >
            <span aria-hidden className={`size-1.5 rounded-full ${status.state === "open" ? "animate-pulse-dot bg-success" : "bg-current"}`} />
            {status.label}
          </span>
        )}
      </div>

      <p className="mt-4 flex gap-2 text-sm leading-relaxed text-ink-2">
        <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-subtle" /> {o.address}
      </p>

      <details className="group mt-3 text-sm">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-ink-2 [&::-webkit-details-marker]:hidden">
          <Clock aria-hidden className="size-4 text-subtle" />
          <span>
            {summariseHours(o.hours)
              .map((h) => `${h.days} ${h.hours}`)
              .join(" · ") || "Hours not published"}
          </span>
        </summary>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 rounded-xl bg-canvas p-4 text-sm">
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => {
            const h = o.hours.find((x) => x.day === d);
            return (
              <div key={d} className="contents">
                <dt className="text-muted">{d}</dt>
                <dd className="tabular">{h?.hours ?? <span className="text-subtle">Not published</span>}</dd>
              </div>
            );
          })}
        </dl>
      </details>

      <div className="mt-5 flex flex-wrap gap-2">
        {o.phones.map((p) => (
          <a key={p} href={telHref(p)} className="inline-flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-white hover:bg-ink-2">
            <Phone aria-hidden className="size-4" /> <span className="tabular">{formatPhone(p)}</span>
          </a>
        ))}
        <a href={directionsHref(o)} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium ring-1 ring-line-strong hover:ring-ink/40">
          <Navigation aria-hidden className="size-4" /> Directions
        </a>
        {o.email && (
          <a href={`mailto:${o.email}`} className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-ink-2 hover:bg-sunken">
            <Mail aria-hidden className="size-4" /> Email
          </a>
        )}
      </div>
    </article>
  );
}
