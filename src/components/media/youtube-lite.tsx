"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";

/** Click-to-load YouTube: no third-party requests until the visitor presses play. */
export function YouTubeLite({ id, title, thumb, className = "" }: { id: string; title: string; thumb: string | null; className?: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className={`relative aspect-video overflow-hidden rounded-2xl bg-ink ${className}`}>
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0 size-full text-left" aria-label={`Play video: ${title}`}>
          {thumb && <Image src={thumb} alt="" fill sizes="(min-width: 1024px) 33vw, 90vw" className="object-cover opacity-90 transition-[transform,opacity] duration-700 group-hover:scale-105 group-hover:opacity-100" />}
          <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
          <span aria-hidden className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-ink shadow-float transition-transform duration-300 group-hover:scale-110">
            <Play className="ml-0.5 size-5 fill-current" />
          </span>
          <span className="absolute inset-x-0 bottom-0 p-4 text-sm font-medium leading-snug text-white">{title}</span>
        </button>
      )}
    </div>
  );
}
