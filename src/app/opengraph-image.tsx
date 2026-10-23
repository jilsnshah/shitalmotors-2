import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getCar, showrooms, workshops } from "@/lib/content";
import { heroModels } from "@/content/curation";

export const alt = "Shital Motors — Authorised Mahindra Dealer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const car = getCar(heroModels[0])!;
  const photo = await readFile(path.join(process.cwd(), "public", car.image.src));
  const src = `data:image/jpeg;base64,${photo.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#e0e0e2" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 0 64px 64px", width: 560, flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 40, fontWeight: 700, color: "#0c0e12" }}>Shital Motors</div>
            <div style={{ width: 56, height: 5, background: "#c8102e", borderRadius: 3, marginTop: 10 }} />
            <div style={{ fontSize: 18, letterSpacing: 4, color: "#5a626d", marginTop: 14 }}>AUTHORISED MAHINDRA DEALER</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 54, fontWeight: 700, lineHeight: 1.08, color: "#0c0e12" }}>Every Mahindra. One trusted dealer.</div>
            <div style={{ fontSize: 22, color: "#2b3038", marginTop: 20 }}>
              {`${showrooms.length} showrooms · ${workshops.length} workshops · Ahmedabad, Sanand & Surendranagar`}
            </div>
          </div>
        </div>
        <img src={src} alt="" width={630} height={420} style={{ marginTop: 130 }} />
      </div>
    ),
    size,
  );
}
