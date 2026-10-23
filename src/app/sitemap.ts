import type { MetadataRoute } from "next";
import { cars, trucks } from "@/lib/content";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] = "monthly") => ({
    url: `${siteUrl}${path}`,
    changeFrequency,
    priority,
  });
  return [
    page("/", 1, "weekly"),
    page("/cars", 0.9, "weekly"),
    ...cars.map((c) => page(`/cars/${c.slug}`, 0.8, "weekly")),
    page("/commercial", 0.7, "weekly"),
    ...trucks.map((t) => page(`/commercial/${t.slug}`, 0.6)),
    page("/service", 0.8),
    page("/locations", 0.8),
    page("/test-drive", 0.7),
    page("/get-price", 0.7),
    page("/about", 0.5),
    page("/gallery", 0.4),
    page("/testimonials", 0.4),
    page("/contact", 0.6),
    page("/careers", 0.3),
    page("/legal/privacy", 0.1, "yearly"),
    page("/legal/terms", 0.1, "yearly"),
    page("/legal/disclaimer", 0.1, "yearly"),
  ];
}
