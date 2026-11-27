import { ImageResponse } from "next/og";

export const alt = "LifeMode — Your Personal Operating System";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "radial-gradient(ellipse at 76% 35%, #302819 0%, #11100d 38%, #080807 76%)",
          color: "#f3efe6",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px", fontSize: 26, letterSpacing: "8px", color: "#d7bd83" }}>
          <div style={{ width: 48, height: 48, border: "1px solid #d7bd83", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, letterSpacing: 0 }}>L</div>
          LIFEMODE
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 18, letterSpacing: "5px", color: "#c4a765" }}>YOUR PERSONAL OPERATING SYSTEM</div>
          <div style={{ fontSize: 82, lineHeight: 1.04, fontWeight: 600, letterSpacing: "-3px" }}>
            Your life,
            <br />
            <span style={{ color: "#d7bd83", fontFamily: "Georgia, serif", fontStyle: "italic" }}>one system.</span>
          </div>
          <div style={{ fontSize: 24, color: "#c7c0b2", maxWidth: 780 }}>
            Goals, plans, progress and personal growth — brought together.
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #51452f", paddingTop: 22, fontSize: 16, letterSpacing: "3px", color: "#a99a78" }}>
          <span>LIFEMODE.VERCEL.APP</span>
          <span>THINK CLEARLY. LIVE INTENTIONALLY.</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
