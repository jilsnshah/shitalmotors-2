"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Sticky in-page navigation that highlights the section currently in view. */
export function SectionNav({ sections, action }: { sections: { id: string; label: string }[]; action?: ReactNode }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => Boolean(el));
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  return (
    <nav aria-label="On this page" className="sticky top-[4.5rem] z-30 border-b border-line bg-canvas/85 backdrop-blur-xl">
      <div className="container-x flex h-14 items-center gap-4">
        <ul className="scrollbar-none -mx-1 flex flex-1 gap-1 overflow-x-auto px-1">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={active === s.id ? "true" : undefined}
                className={`inline-flex h-9 items-center whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition-colors ${active === s.id ? "bg-ink text-white" : "text-ink-2 hover:bg-ink/5 hover:text-ink"}`}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        {action && <div className="hidden shrink-0 sm:block">{action}</div>}
      </div>
    </nav>
  );
}
