"use client";

import { useId, useRef, useState, type ReactNode } from "react";

/**
 * Accessible tabs whose panels are rendered on the server and passed in.
 * Inactive panels stay in the DOM (hidden), so content remains crawlable.
 */
export function Tabs({
  tabs,
  label,
  className = "",
  listClassName = "",
}: {
  tabs: { id: string; label: ReactNode; count?: number; panel: ReactNode }[];
  label: string;
  className?: string;
  listClassName?: string;
}) {
  const [active, setActive] = useState(0);
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const focus = (i: number) => {
    setActive(i);
    refs.current[i]?.focus();
  };

  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className={`scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1 ${listClassName}`}>
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            id={`${base}-tab-${t.id}`}
            aria-selected={i === active}
            aria-controls={`${base}-panel-${t.id}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") focus((i + 1) % tabs.length);
              if (e.key === "ArrowLeft") focus((i - 1 + tabs.length) % tabs.length);
              if (e.key === "Home") focus(0);
              if (e.key === "End") focus(tabs.length - 1);
            }}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              i === active ? "bg-ink text-white" : "text-ink-2 hover:bg-ink/5 hover:text-ink"
            }`}
          >
            {t.label}
            {t.count != null && (
              <span className={`tabular rounded-full px-1.5 text-xs ${i === active ? "bg-white/15 text-white" : "bg-sunken text-muted"}`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${base}-panel-${t.id}`}
          aria-labelledby={`${base}-tab-${t.id}`}
          hidden={i !== active}
          className="animate-fade-in"
        >
          {t.panel}
        </div>
      ))}
    </div>
  );
}
