"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, Expand } from "lucide-react";

export type GalleryImage = { src: string; alt: string; caption?: string; width?: number | null; height?: number | null };

/**
 * Responsive image grid with a native <dialog> lightbox:
 * focus is trapped, Escape closes, arrow keys and swipes navigate.
 */
export function LightboxGallery({
  images,
  layout = "grid",
  studio = false,
  className = "",
}: {
  images: GalleryImage[];
  layout?: "grid" | "masonry" | "feature";
  studio?: boolean;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);
  const touchX = useRef<number | null>(null);

  const open = (i: number) => {
    setIndex(i);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();
  const step = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + images.length) % images.length)), [images.length]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    const onClose = () => setIndex(null);
    dlg.addEventListener("keydown", onKey);
    dlg.addEventListener("close", onClose);
    return () => {
      dlg.removeEventListener("keydown", onKey);
      dlg.removeEventListener("close", onClose);
    };
  }, [step]);

  const current = index === null ? null : images[index];
  const gridClass =
    layout === "masonry"
      ? "columns-2 gap-3 md:columns-3 lg:columns-4 [&>li]:mb-3 [&>li]:break-inside-avoid"
      : layout === "feature"
        ? "grid grid-cols-2 gap-3 md:grid-cols-4 [&>li:first-child]:col-span-2 [&>li:first-child]:row-span-2"
        : "grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4";

  return (
    <>
      <ul className={`${gridClass} ${className}`}>
        {images.map((img, i) => (
          <li key={img.src}>
            <button
              type="button"
              onClick={() => open(i)}
              className={`group relative block w-full overflow-hidden rounded-2xl ${studio ? "bg-studio" : "bg-sunken"} ${layout === "masonry" ? "" : "aspect-[3/2] h-full"}`}
              aria-label={`View larger: ${img.alt}`}
            >
              {layout === "masonry" && img.width && img.height ? (
                <Image src={img.src} alt={img.alt} width={img.width} height={img.height} sizes="(min-width: 1024px) 24vw, (min-width: 768px) 32vw, 48vw" className="h-auto w-full transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:scale-[1.04]" />
              ) : (
                <Image src={img.src} alt={img.alt} fill sizes={layout === "feature" && i === 0 ? "(min-width: 768px) 50vw, 100vw" : "(min-width: 1024px) 24vw, (min-width: 768px) 32vw, 48vw"} className="object-cover transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:scale-[1.04]" />
              )}
              <span aria-hidden className="absolute right-2.5 top-2.5 grid size-8 place-items-center rounded-full bg-white/85 text-ink opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                <Expand className="size-3.5" />
              </span>
              {img.caption && (
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-3 pt-10 text-left text-xs font-medium leading-snug text-white">{img.caption}</span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        aria-label="Image viewer"
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink/95 p-0 text-white backdrop:bg-ink/80 open:animate-fade-in"
        onClick={(e) => e.target === e.currentTarget && close()}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        {current && (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="tabular text-white/70">
                {index! + 1} / {images.length}
              </span>
              <button type="button" onClick={close} className="grid size-11 place-items-center rounded-full hover:bg-white/10" aria-label="Close viewer" autoFocus>
                <X className="size-5" />
              </button>
            </div>
            <div className="relative flex-1" onClick={(e) => e.target === e.currentTarget && close()}>
              <div className={`absolute inset-4 md:inset-x-20 ${studio ? "rounded-3xl bg-studio" : ""}`}>
                <Image key={current.src} src={current.src} alt={current.alt} fill sizes="100vw" quality={90} className="animate-fade-in object-contain" />
              </div>
              {images.length > 1 && (
                <>
                  <button type="button" onClick={() => step(-1)} className="absolute left-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 backdrop-blur hover:bg-white/20" aria-label="Previous image">
                    <ChevronLeft className="size-6" />
                  </button>
                  <button type="button" onClick={() => step(1)} className="absolute right-3 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/10 backdrop-blur hover:bg-white/20" aria-label="Next image">
                    <ChevronRight className="size-6" />
                  </button>
                </>
              )}
            </div>
            <p className="px-4 py-4 text-center text-sm text-white/80">{current.caption ?? current.alt}</p>
          </div>
        )}
      </dialog>
    </>
  );
}
