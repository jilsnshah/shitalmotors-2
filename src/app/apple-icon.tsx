import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#0c0e12", color: "white" }}>
        <div style={{ fontSize: 104, fontWeight: 700, lineHeight: 1 }}>S</div>
        <div style={{ width: 70, height: 8, borderRadius: 4, background: "#c8102e", marginTop: 10 }} />
      </div>
    ),
    size,
  );
}
