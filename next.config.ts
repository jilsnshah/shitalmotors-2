import type { NextConfig } from "next";

/**
 * Old dealersites.in URLs → new routes, so existing search rankings,
 * bookmarks and shared links keep working after launch.
 */
const legacyRedirects: NextConfig["redirects"] = async () => [
  { source: "/new-cars.html", destination: "/cars", permanent: true },
  { source: "/new-cars/mahindra-:slug/:tab(pictures|colors|specification).html", destination: "/cars/:slug", permanent: true },
  { source: "/new-cars/mahindra-:slug.html", destination: "/cars/:slug", permanent: true },
  { source: "/new-trucks.html", destination: "/commercial", permanent: true },
  { source: "/new-trucks/:slug.html", destination: "/commercial/:slug", permanent: true },
  { source: "/bookservice.html", destination: "/service", permanent: true },
  { source: "/outlet.html", destination: "/locations", permanent: true },
  { source: "/outlet/:path*", destination: "/locations", permanent: true },
  { source: "/about-us.html", destination: "/about", permanent: true },
  { source: "/gallery.html", destination: "/gallery", permanent: true },
  { source: "/videos.html", destination: "/gallery#videos", permanent: true },
  { source: "/testimonial.html", destination: "/testimonials", permanent: true },
  { source: "/contact-us.html", destination: "/contact", permanent: true },
  { source: "/getintouch.html", destination: "/contact", permanent: true },
  { source: "/upload-resume.html", destination: "/careers", permanent: true },
  { source: "/privacy.html", destination: "/legal/privacy", permanent: true },
  { source: "/terms-and-conditions.html", destination: "/legal/terms", permanent: true },
  { source: "/disclaimer.html", destination: "/legal/disclaimer", permanent: true },
  { source: "/sitemap.html", destination: "/sitemap.xml", permanent: true },
];

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 80, 90],
    // All media is synced into /public/media by scripts/sync-content.mjs.
    localPatterns: [{ pathname: "/media/**", search: "" }],
    minimumCacheTTL: 2678400,
  },
  redirects: legacyRedirects,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/media/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, stale-while-revalidate=86400" }] },
    ];
  },
};

export default nextConfig;
