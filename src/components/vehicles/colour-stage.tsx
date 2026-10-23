"use client";

import Image from "next/image";
import { useState } from "react";

export type StageColour = { name: string; hex: string; src: string };

/**
 * Colour configurator. The OEM colour renders are on pure white, so the stage
 * is white and every render is stacked and cross-faded — switching is instant
 * after the first paint and there is no layout shift.
 */
export function ColourStage({
  model,
  colours,
  className = "",
  size = "lg",
  initial = 0,
}: {
  model: string;
  colours: StageColour[];
  className?: string;
  size?: "md" | "lg";
  initial?: number;
}) {
  const [active, setActive] = useState(initial);
  const [loaded, setLoaded] = useState<Set<number>>(() => new Set([initial]));
  const current = colours[active];
  if (!current) return null;

  const pick = (i: number) => {
    setLoaded((s) => new Set(s).add(i));
    setActive(i);
  };

  return (
    <div className={className}>
      <div className="relative aspect-[10/7] w-full">
        {colours.map((c, i) =>
          loaded.has(i) ? (
            <Image
              key={c.src}
              src={c.src}
              alt={i === active ? `${model} in ${c.name}` : ""}
              aria-hidden={i !== active}
              fill
              sizes={size === "lg" ? "(min-width: 1024px) 50vw, 92vw" : "(min-width: 1024px) 34vw, 92vw"}
              quality={90}
              className={`object-contain transition-[opacity,transform] duration-700 ease-[var(--ease-out-quint)] ${i === active ? "scale-100 opacity-100" : "scale-[0.985] opacity-0"}`}
            />
          ) : null,
        )}
        {/* Soft contact shadow so the car sits on the page */}
        <div aria-hidden className="absolute inset-x-[12%] bottom-[9%] -z-0 h-[7%] rounded-[50%] bg-ink/10 blur-xl" />
      </div>

      <div className="mt-4 flex flex-col items-center gap-3">
        <p className="text-sm" aria-live="polite">
          <span className="text-muted">Colour </span>
          <span className="font-medium text-ink">{current.name}</span>
          <span className="text-subtle"> · {active + 1}/{colours.length}</span>
        </p>
        <div role="radiogroup" aria-label={`${model} colours`} className="flex max-w-full flex-wrap justify-center gap-2.5">
          {colours.map((c, i) => (
            <button
              key={`${c.name}-${i}`}
              type="button"
              role="radio"
              aria-checked={i === active}
              aria-label={c.name}
              title={c.name}
              onClick={() => pick(i)}
              onPointerEnter={() => setLoaded((s) => (s.has(i) ? s : new Set(s).add(i)))}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                  e.preventDefault();
                  const n = (i + 1) % colours.length;
                  pick(n);
                  (e.currentTarget.parentElement?.children[n] as HTMLElement | undefined)?.focus();
                }
                if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                  e.preventDefault();
                  const n = (i - 1 + colours.length) % colours.length;
                  pick(n);
                  (e.currentTarget.parentElement?.children[n] as HTMLElement | undefined)?.focus();
                }
              }}
              tabIndex={i === active ? 0 : -1}
              className={`relative size-8 rounded-full ring-offset-2 ring-offset-surface transition-[box-shadow,transform] duration-300 hover:scale-110 ${i === active ? "ring-2 ring-ink" : "ring-1 ring-ink/15"}`}
              style={{ background: `radial-gradient(circle at 32% 28%, rgb(255 255 255 / 0.55), transparent 42%), ${c.hex}` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
