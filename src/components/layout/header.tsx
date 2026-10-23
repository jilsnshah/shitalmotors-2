"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Menu, Phone, X, Zap, ArrowRight } from "lucide-react";
import { Wordmark } from "./wordmark";
import { buttonClass } from "@/components/ui/button";

export type MenuVehicle = { name: string; href: string; price: string | null; thumb: string | null };
export type HeaderProps = {
  suvs: MenuVehicle[];
  electric: MenuVehicle[];
  commercial: MenuVehicle[];
  salesPhone: { display: string; href: string };
  links: { label: string; href: string }[];
  company: { label: string; href: string }[];
};

export function Header({ suvs, electric, commercial, salesPhone, links, company }: HeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const megaId = useId();
  const moreId = useId();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close every menu after navigation (state reset during render, DOM dialog in an effect).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMegaOpen(false);
    setMoreOpen(false);
  }
  useEffect(() => {
    drawerRef.current?.close();
  }, [pathname]);

  // Escape and outside-click close the desktop menus.
  useEffect(() => {
    if (!megaOpen && !moreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMegaOpen(false);
        setMoreOpen(false);
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) {
        setMegaOpen(false);
        setMoreOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [megaOpen, moreOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const solid = scrolled || megaOpen || moreOpen;

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-40 transition-[background-color,box-shadow,border-color] duration-300 ${
        solid ? "border-b border-line bg-surface/90 shadow-[0_8px_30px_-18px_rgb(12_14_18/0.25)] backdrop-blur-xl" : "border-b border-transparent bg-canvas/70 backdrop-blur-md"
      }`}
    >
      <div className="container-x flex h-[4.5rem] items-center gap-6">
        <Wordmark />

        <nav aria-label="Primary" className="ml-6 hidden items-center gap-1 lg:flex">
          <button
            type="button"
            aria-expanded={megaOpen}
            aria-controls={megaId}
            onClick={() => {
              setMegaOpen((v) => !v);
              setMoreOpen(false);
            }}
            className={`inline-flex h-10 items-center gap-1 rounded-full px-3.5 text-[0.94rem] font-medium transition-colors hover:bg-ink/5 ${megaOpen || isActive("/cars") ? "text-ink" : "text-ink-2"}`}
          >
            Vehicles
            <ChevronDown aria-hidden className={`size-4 transition-transform duration-300 ${megaOpen ? "rotate-180" : ""}`} />
          </button>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`relative inline-flex h-10 items-center rounded-full px-3.5 text-[0.94rem] font-medium transition-colors hover:bg-ink/5 ${isActive(l.href) ? "text-ink after:absolute after:inset-x-3.5 after:bottom-1 after:h-[2px] after:rounded-full after:bg-accent" : "text-ink-2"}`}
            >
              {l.label}
            </Link>
          ))}
          <div className="relative">
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-controls={moreId}
              onClick={() => {
                setMoreOpen((v) => !v);
                setMegaOpen(false);
              }}
              className="inline-flex h-10 items-center gap-1 rounded-full px-3.5 text-[0.94rem] font-medium text-ink-2 transition-colors hover:bg-ink/5"
            >
              Company
              <ChevronDown aria-hidden className={`size-4 transition-transform duration-300 ${moreOpen ? "rotate-180" : ""}`} />
            </button>
            <div
              id={moreId}
              hidden={!moreOpen}
              className="absolute left-0 top-12 w-56 animate-rise rounded-2xl border border-line bg-surface p-2 shadow-float"
            >
              {company.map((l) => (
                <Link key={l.href} href={l.href} className="block rounded-xl px-3 py-2.5 text-sm text-ink-2 hover:bg-sunken hover:text-ink">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <a href={salesPhone.href} className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm text-ink-2 hover:bg-ink/5 xl:inline-flex">
            <Phone aria-hidden className="size-4" />
            <span>
              <span className="text-muted">Sales </span>
              <span className="tabular font-medium text-ink">{salesPhone.display}</span>
            </span>
          </a>
          <span className="hidden sm:block">
            <Link href="/test-drive" className={buttonClass("primary", "sm")}>
              Book a test drive
            </Link>
          </span>
          <button
            type="button"
            onClick={() => drawerRef.current?.showModal()}
            className="inline-flex size-11 items-center justify-center rounded-full text-ink hover:bg-ink/5 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {/* Desktop mega menu */}
      <div id={megaId} hidden={!megaOpen} className="absolute inset-x-0 top-full hidden border-b border-line bg-surface shadow-[0_30px_60px_-30px_rgb(12_14_18/0.35)] lg:block">
        <div className="container-x grid animate-fade-in grid-cols-12 gap-8 py-8">
          <MegaColumn title="SUVs" href="/cars?segment=suv" items={suvs} className="col-span-5" columns={2} />
          <MegaColumn title="Electric SUVs" href="/cars?segment=electric" items={electric} className="col-span-4" icon />
          <div className="col-span-3 flex flex-col gap-3 rounded-2xl bg-sunken p-5">
            <p className="eyebrow">Commercial</p>
            <ul className="space-y-1">
              {commercial.slice(0, 6).map((v) => (
                <li key={v.href}>
                  <Link href={v.href} className="flex items-baseline justify-between gap-3 rounded-lg py-1.5 text-sm text-ink-2 hover:text-ink">
                    <span>{v.name}</span>
                    {v.price && <span className="tabular shrink-0 text-xs text-muted">{v.price}</span>}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/commercial" className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-ink">
              All commercial vehicles <ArrowRight aria-hidden className="size-4" />
            </Link>
          </div>
        </div>
        <div className="border-t border-line">
          <div className="container-x flex items-center justify-between py-3 text-sm text-muted">
            <span>Prices are ex-showroom, Ahmedabad, and subject to change.</span>
            <Link href="/cars" className="font-medium text-ink hover:text-accent">Explore all SUVs →</Link>
          </div>
        </div>
      </div>

      {/* Mobile drawer — a native modal dialog gives focus trapping and Escape for free */}
      <dialog
        ref={drawerRef}
        aria-label="Menu"
        className="m-0 ml-auto h-dvh max-h-none w-full max-w-md overflow-y-auto bg-surface p-0 text-ink backdrop:bg-ink/40 backdrop:backdrop-blur-sm open:animate-fade-in"
        onClick={(e) => {
          if (e.target === drawerRef.current) drawerRef.current?.close();
        }}
      >
        <div className="flex h-[4.5rem] items-center justify-between border-b border-line px-5">
          <Wordmark />
          <button type="button" onClick={() => drawerRef.current?.close()} aria-label="Close menu" className="inline-flex size-11 items-center justify-center rounded-full hover:bg-ink/5">
            <X className="size-5" />
          </button>
        </div>
        <nav aria-label="Mobile" className="px-5 py-4">
          <DrawerGroup title="SUVs" items={suvs} />
          <DrawerGroup title="Electric SUVs" items={electric} />
          <DrawerGroup title="Commercial" items={commercial} />
          <ul className="mt-2 divide-y divide-line border-t border-line">
            {[...links, ...company].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="flex items-center justify-between py-3.5 text-base font-medium">
                  {l.label}
                  <ArrowRight aria-hidden className="size-4 text-subtle" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 grid gap-3">
            <Link href="/test-drive" className={buttonClass("primary", "lg", "w-full")}>Book a test drive</Link>
            <Link href="/get-price" className={buttonClass("secondary", "lg", "w-full")}>Get on-road price</Link>
            <a href={salesPhone.href} className={buttonClass("ghost", "lg", "w-full")}>
              <Phone aria-hidden className="size-4" /> Call sales {salesPhone.display}
            </a>
          </div>
        </nav>
      </dialog>
    </header>
  );
}

function MegaColumn({ title, href, items, className, columns = 1, icon }: { title: string; href: string; items: MenuVehicle[]; className?: string; columns?: 1 | 2; icon?: boolean }) {
  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <p className="eyebrow inline-flex items-center gap-1.5">
          {icon && <Zap aria-hidden className="size-3.5 text-electric" />}
          {title}
        </p>
        <Link href={href} className="text-xs font-medium text-muted hover:text-ink">View all</Link>
      </div>
      <ul className={`grid gap-1 ${columns === 2 ? "grid-cols-2" : ""}`}>
        {items.map((v) => (
          <li key={v.href}>
            <Link href={v.href} className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-sunken">
              {v.thumb && (
                <span className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-studio">
                  <Image src={v.thumb} alt="" fill sizes="64px" className="object-cover transition-transform duration-500 group-hover:scale-110" />
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{v.name}</span>
                {v.price && <span className="tabular block text-xs text-muted">from {v.price}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DrawerGroup({ title, items }: { title: string; items: MenuVehicle[] }) {
  return (
    <details className="group border-b border-line [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 text-base font-medium">
        {title}
        <ChevronDown aria-hidden className="size-4 text-subtle transition-transform group-open:rotate-180" />
      </summary>
      <ul className="grid grid-cols-2 gap-2 pb-4">
        {items.map((v) => (
          <li key={v.href}>
            <Link href={v.href} className="block rounded-xl bg-sunken p-2.5">
              {v.thumb && (
                <span className="relative mb-2 block aspect-[16/10] overflow-hidden rounded-lg bg-studio">
                  <Image src={v.thumb} alt="" fill sizes="45vw" className="object-cover" />
                </span>
              )}
              <span className="block text-sm font-medium leading-tight">{v.name}</span>
              {v.price && <span className="tabular text-xs text-muted">from {v.price}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
