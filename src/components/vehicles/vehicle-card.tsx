import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Zap } from "lucide-react";
import type { Car, Truck } from "@/lib/content";
import { formatLakh } from "@/lib/format";

export type TileData = {
  href: string;
  name: string;
  alt: string;
  image: string;
  studio: boolean; // OEM studio photo (sits on the studio-grey stage) vs. lifestyle photo
  electric: boolean;
  meta: string;
  variantCount: number;
  price: string | null;
};

const transmissionLabel = (t: string[]) => (t.length > 1 ? "MT · AT" : t[0] === "Automatic" ? "AT" : "MT");

export function carTile(car: Car): TileData {
  return {
    href: `/cars/${car.slug}`,
    name: car.name,
    alt: car.fullName,
    image: car.image.src,
    studio: true,
    electric: car.segment === "electric",
    meta: [car.fuels.join(" · "), transmissionLabel(car.transmissions)].join("  ·  "),
    variantCount: car.variants.length,
    price: formatLakh(car.startingPrice),
  };
}

export function truckTile(t: Truck): TileData {
  return {
    href: `/commercial/${t.slug}`,
    name: t.name,
    alt: `Mahindra ${t.name}`,
    image: t.image.src,
    studio: false,
    electric: false,
    meta: [t.typeLabel.replace(/s$/, ""), [...new Set(t.variants.map((v) => v.fuel).filter(Boolean))].join(" · ")].filter(Boolean).join("  ·  "),
    variantCount: t.variants.length,
    price: formatLakh(t.startingPrice),
  };
}

export function VehicleTile({ data, priority, sizes }: { data: TileData; priority?: boolean; sizes?: string }) {
  return (
    <Link
      href={data.href}
      className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-xs transition-[transform,box-shadow,border-color] duration-500 ease-[var(--ease-out-quint)] hover:-translate-y-1 hover:border-line-strong hover:shadow-lift"
    >
      <div className={`relative aspect-[3/2] ${data.studio ? "stage" : "bg-sunken"}`}>
        <Image
          src={data.image}
          alt={data.alt}
          fill
          sizes={sizes ?? "(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 92vw"}
          fetchPriority={priority ? "high" : undefined}
          loading={priority ? "eager" : "lazy"}
          quality={80}
          className="z-[1] object-cover transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:scale-[1.045]"
        />
        {data.electric && (
          <span className="absolute left-3 top-3 z-[3] inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[0.7rem] font-semibold text-electric backdrop-blur">
            <Zap aria-hidden className="size-3" /> Electric
          </span>
        )}
        <span
          aria-hidden
          className="absolute right-3 top-3 z-[3] grid size-9 translate-y-1 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow-xs backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        >
          <ArrowUpRight className="size-4" />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold leading-tight tracking-tight [font-variation-settings:'wdth'_110]">{data.name}</h3>
          <span className="shrink-0 pt-1 text-xs text-muted">
            {data.variantCount} variant{data.variantCount === 1 ? "" : "s"}
          </span>
        </div>
        <p className="text-sm text-muted">{data.meta}</p>
        <div className="mt-auto flex items-baseline justify-between border-t border-line pt-3">
          <span className="text-xs uppercase tracking-wider text-subtle">Ex-showroom from</span>
          <span className="tabular font-display text-lg font-semibold [font-variation-settings:'wdth'_108]">{data.price ?? "On request"}</span>
        </div>
      </div>
    </Link>
  );
}

export function VehicleCard(props: ({ kind: "car"; car: Car } | { kind: "truck"; truck: Truck }) & { priority?: boolean; sizes?: string }) {
  const data = props.kind === "car" ? carTile(props.car) : truckTile(props.truck);
  return <VehicleTile data={data} priority={props.priority} sizes={props.sizes} />;
}
