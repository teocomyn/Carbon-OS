import { ImageResponse } from "next/og";

export const alt =
  "Carbon OS — Mesurez, comprenez et réduisez votre empreinte carbone";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0b0c0f",
          color: "#f7f7f4",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
          padding: "64px 72px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            background:
              "radial-gradient(circle at center, rgba(117,104,255,.5), rgba(11,12,15,0) 68%)",
            display: "flex",
            height: 680,
            position: "absolute",
            right: -170,
            top: -270,
            width: 680,
          }}
        />
        <div style={{ alignItems: "center", display: "flex", gap: 16 }}>
          <div
            style={{
              alignItems: "center",
              background: "#f7f7f4",
              borderRadius: 12,
              display: "flex",
              height: 42,
              justifyContent: "center",
              position: "relative",
              width: 42,
            }}
          >
            <div
              style={{
                background: "#111218",
                borderRadius: 999,
                display: "flex",
                height: 14,
                width: 14,
              }}
            />
            <div
              style={{
                background: "#7568ff",
                borderRadius: 999,
                bottom: -4,
                display: "flex",
                height: 24,
                position: "absolute",
                right: -4,
                width: 24,
              }}
            />
          </div>
          <div style={{ display: "flex", fontSize: 24, fontWeight: 700 }}>
            CARBON&nbsp;
            <span style={{ color: "#959aa5", fontWeight: 500 }}>OS</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 105,
            maxWidth: 900,
          }}
        >
          <div
            style={{
              color: "#8f84ff",
              display: "flex",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            Votre tableau de bord carbone personnel
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: -4,
              lineHeight: 1.02,
              marginTop: 28,
            }}
          >
            Comprendre ce qui compte. Réduire ce qui pèse.
          </div>
        </div>
        <div
          style={{
            bottom: 60,
            color: "#959aa5",
            display: "flex",
            fontSize: 20,
            justifyContent: "space-between",
            left: 72,
            position: "absolute",
            right: 72,
          }}
        >
          <span>≈ 4 minutes · Gratuit · Sans compte</span>
          <span>Mesurer → Comprendre → Réduire</span>
        </div>
      </div>
    ),
    size,
  );
}
