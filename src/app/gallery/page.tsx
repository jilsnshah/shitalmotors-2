import type { Metadata } from "next";
import { dealer, isMedia } from "@/lib/content";
import { awardCaptions } from "@/content/curation";
import { PageHero, SectionHeader } from "@/components/ui/primitives";
import { Tabs } from "@/components/ui/tabs";
import { LightboxGallery } from "@/components/media/lightbox-gallery";
import { YouTubeLite } from "@/components/media/youtube-lite";
import { breadcrumbLd, JsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Gallery & Videos",
  description: "Photos from Shital Motors showrooms, customer deliveries and awards, plus Mahindra and Shital Motors videos.",
  alternates: { canonical: "/gallery" },
};

const ALT: Record<string, string> = {
  "showroom-images": "Shital Motors showroom",
  "delivering-happiness": "Customer delivery at Shital Motors",
  awards: "Award presented to Shital Motors",
};

export default function GalleryPage() {
  const categories = [...new Set(dealer.videos.map((v) => v.category ?? "Other"))];
  return (
    <>
      <PageHero breadcrumbs={[{ label: "Home", href: "/" }, { label: "Gallery" }]} eyebrow="Gallery" title="Moments from Shital Motors" lead="Our showrooms, the families who've taken delivery with us, and recognition along the way." />

      <section aria-label="Photos" className="container-x mt-10">
        <Tabs
          label="Photo categories"
          tabs={dealer.gallery.map((g) => {
            const images = g.images.filter(isMedia).map((img, i) => {
              const key = img.src.split("/").pop()!.replace(/\.\w+$/, "");
              const caption = g.id === "awards" ? awardCaptions[key] : undefined;
              return { src: img.src, width: img.width, height: img.height, alt: caption ?? `${ALT[g.id] ?? g.title} (${i + 1})`, caption };
            });
            return { id: g.id, label: g.title, count: images.length, panel: <LightboxGallery className="mt-8" images={images} /> };
          })}
        />
      </section>

      <section id="videos" aria-labelledby="videos-title" className="container-x scroll-mt-24 pt-24">
        <SectionHeader id="videos-title" eyebrow="Videos" title="Watch" lead="Videos play from YouTube only when you press play." />
        {categories.map((cat) => (
          <div key={cat} className="mt-10">
            <h3 className="eyebrow mb-4">{cat}</h3>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {dealer.videos
                .filter((v) => (v.category ?? "Other") === cat)
                .map((v) => (
                  <YouTubeLite key={v.id} id={v.id} title={v.title} thumb={v.thumb?.src ?? null} />
                ))}
            </div>
          </div>
        ))}
      </section>
      <JsonLd data={breadcrumbLd([{ name: "Home", path: "/" }, { name: "Gallery", path: "/gallery" }])} />
    </>
  );
}
