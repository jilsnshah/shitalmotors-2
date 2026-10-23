import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shital Motors — Authorised Mahindra Dealer",
    short_name: "Shital Motors",
    description: "Mahindra SUVs, electric SUVs, commercial vehicles and service in Ahmedabad, Sanand and Surendranagar.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f6f4",
    theme_color: "#0c0e12",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
