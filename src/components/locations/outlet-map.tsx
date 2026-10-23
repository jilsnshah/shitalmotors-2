"use client";

import { useState } from "react";

export type MapPoint = { id: string; label: string; kind: "showroom" | "workshop"; lat: number; lng: number; city: string };

const PAD = 0.035; // degrees of padding around the mapped outlets
const KM_PER_DEG = 111.2;
const FAR_KM = 45; // outlets further than this from the main cluster get an edge pointer

const toRad = (d: number) => (d * Math.PI) / 180;
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/**
 * A lightweight, dependency-free map: outlets plotted from their published
 * coordinates (equirectangular, latitude-corrected) with a true-to-scale
 * distance bar. Distant outlets are shown as a labelled pointer at the map
 * edge rather than shrinking the whole map to fit them. No tiles, no
 * third-party scripts, no cookies.
 */
export function OutletMap({
  points,
  activeId,
  onSelect,
  className = "",
}: {
  points: MapPoint[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  const [hover, setHover] = useState<string | null>(null);

  // The main cluster is the city with the most outlets; anything far from it is "remote".
  const counts = new Map<string, number>();
  points.forEach((p) => counts.set(p.city, (counts.get(p.city) ?? 0) + 1));
  const mainCity = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const main = points.filter((p) => p.city === mainCity);
  const centre = { lat: main.reduce((s, p) => s + p.lat, 0) / main.length, lng: main.reduce((s, p) => s + p.lng, 0) / main.length };
  const near = points.filter((p) => distanceKm(p, centre) <= FAR_KM);
  const far = points.filter((p) => distanceKm(p, centre) > FAR_KM);

  const minLat = Math.min(...near.map((p) => p.lat)) - PAD;
  const maxLat = Math.max(...near.map((p) => p.lat)) + PAD;
  const minLng = Math.min(...near.map((p) => p.lng)) - PAD * 1.6;
  const maxLng = Math.max(...near.map((p) => p.lng)) + PAD * 1.6;
  const kx = Math.cos(toRad((minLat + maxLat) / 2));
  const W = 1000;
  const H = Math.round((W * (maxLat - minLat)) / ((maxLng - minLng) * kx));
  const x = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * W;
  const y = (lat: number) => ((maxLat - lat) / (maxLat - minLat)) * H;
  const kmPerUnit = ((maxLng - minLng) * kx * KM_PER_DEG) / W;
  const bar = 5 / kmPerUnit;

  // Group far outlets by city into one pointer each, stacked in the top-left
  // corner (empty for this network); the arrow shows the true direction.
  const farGroups = [...new Set(far.map((p) => p.city))].map((city, i) => {
    const ps = far.filter((p) => p.city === city);
    const c = { lat: ps.reduce((s, p) => s + p.lat, 0) / ps.length, lng: ps.reduce((s, p) => s + p.lng, 0) / ps.length };
    const angle = Math.atan2(-(c.lat - centre.lat), (c.lng - centre.lng) * kx);
    return { city, ps, km: Math.round(distanceKm(c, centre) / 5) * 5, px: 44, py: 52 + i * 110, angle };
  });

  const cityLabels = [...new Set(near.map((p) => p.city))].map((city) => {
    const ps = near.filter((p) => p.city === city);
    const top = Math.min(...ps.map((p) => y(p.lat)));
    const cx = x(ps.reduce((s, p) => s + p.lng, 0) / ps.length);
    return { city, x: Math.min(Math.max(cx, 90), W - 90), y: Math.max(top - 40, 28) };
  });

  const focus = hover ?? activeId ?? null;
  const interactive = Boolean(onSelect);

  const marker = (p: MapPoint, cx: number, cy: number, showLabel: boolean) => {
    const isFocus = focus === p.id;
    const labelW = p.label.length * 7.6 + 26;
    const lx = Math.min(Math.max(0, -labelW / 2 + 0), 0);
    return (
      <g
        key={p.id}
        transform={`translate(${cx} ${cy})`}
        onMouseEnter={() => setHover(p.id)}
        onMouseLeave={() => setHover(null)}
        onFocus={() => setHover(p.id)}
        onBlur={() => setHover(null)}
        onClick={() => onSelect?.(p.id)}
        onKeyDown={(e) => {
          if (interactive && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onSelect?.(p.id);
          }
        }}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? "button" : undefined}
        aria-label={interactive ? `${p.label} ${p.kind}` : undefined}
        aria-pressed={interactive ? activeId === p.id : undefined}
        className={interactive ? "cursor-pointer outline-none" : undefined}
      >
        {isFocus && <circle r="64" fill="url(#map-glow)" />}
        <circle r="22" fill="transparent" />
        {p.kind === "showroom" ? (
          <circle r={isFocus ? 12 : 9} fill={isFocus ? "var(--color-accent)" : "var(--color-ink)"} stroke="white" strokeWidth="3" className="transition-all duration-300" />
        ) : (
          <rect x={isFocus ? -10 : -8} y={isFocus ? -10 : -8} width={isFocus ? 20 : 16} height={isFocus ? 20 : 16} rx="3" fill="white" stroke={isFocus ? "var(--color-accent)" : "var(--color-ink)"} strokeWidth="3.5" transform="rotate(45)" className="transition-all duration-300" />
        )}
        {(isFocus || showLabel) && (
          <g className="pointer-events-none" transform={`translate(${lx} 0)`}>
            <rect x={-labelW / 2} y={-60} width={labelW} height={34} rx={17} fill={isFocus ? "var(--color-ink)" : "white"} stroke={isFocus ? "none" : "var(--color-line-strong)"} />
            <text y={-37.5} textAnchor="middle" className={`text-[16px] font-medium ${isFocus ? "fill-white" : "fill-ink"}`}>
              {p.label}
            </text>
          </g>
        )}
      </g>
    );
  };

  return (
    <figure className={className}>
      <svg viewBox={`0 0 ${W} ${H}`} role={interactive ? "group" : "img"} aria-labelledby="outlet-map-title" className="h-auto w-full overflow-visible">
        <title id="outlet-map-title">Map of Shital Motors showrooms and workshops</title>
        <defs>
          <pattern id="map-dots" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.4" fill="var(--color-line-strong)" />
          </pattern>
          <radialGradient id="map-glow">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} rx="18" fill="url(#map-dots)" />

        {cityLabels.map((c) => (
          <text key={c.city} x={c.x} y={c.y} textAnchor="middle" className="fill-subtle font-display text-[20px] font-semibold uppercase tracking-[0.2em]">
            {c.city}
          </text>
        ))}

        {near.map((p) => marker(p, x(p.lng), y(p.lat), false))}

        {farGroups.map((g) => (
          <g key={g.city} transform={`translate(${g.px} ${g.py})`}>
            <rect x={-26} y={-34} width={300} height={104} rx={18} fill="white" stroke="var(--color-line)" />
            <g transform={`rotate(${(g.angle * 180) / Math.PI})`}>
              <path d="M 12 0 L -8 -10 L -3 0 L -8 10 Z" fill="var(--color-accent)" />
            </g>
            <text x={24} y={-4} className="fill-ink font-display text-[18px] font-semibold uppercase tracking-[0.14em]">{g.city}</text>
            <text x={24} y={20} className="fill-muted text-[15px]">≈{g.km} km from {mainCity}</text>
            {g.ps.map((p, i) => (
              <g key={p.id} transform={`translate(${36 + i * 34} 46)`}>{marker(p, 0, 0, false)}</g>
            ))}
          </g>
        ))}

        <g transform={`translate(${W - bar - 34} ${H - 30})`}>
          <line x1="0" x2={bar} y1="0" y2="0" stroke="var(--color-ink)" strokeWidth="2.5" />
          <line x1="0" x2="0" y1="-7" y2="7" stroke="var(--color-ink)" strokeWidth="2.5" />
          <line x1={bar} x2={bar} y1="-7" y2="7" stroke="var(--color-ink)" strokeWidth="2.5" />
          <text x={bar / 2} y="-14" textAnchor="middle" className="fill-ink-2 text-[16px] font-medium">5 km</text>
        </g>
      </svg>
      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
        <span className="inline-flex items-center gap-2">
          <svg width="12" height="12" aria-hidden><circle cx="6" cy="6" r="5" fill="var(--color-ink)" /></svg> Showroom
        </span>
        <span className="inline-flex items-center gap-2">
          <svg width="12" height="12" aria-hidden><rect x="2.5" y="2.5" width="7" height="7" fill="white" stroke="var(--color-ink)" strokeWidth="2" transform="rotate(45 6 6)" /></svg> Workshop
        </span>
        <span>Plotted from published outlet coordinates{interactive ? " — select a marker for details" : ""}.</span>
      </figcaption>
    </figure>
  );
}
