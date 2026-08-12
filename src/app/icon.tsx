import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#111218",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#f7f7f4",
            borderRadius: 18,
            display: "flex",
            height: 36,
            position: "relative",
            width: 36,
          }}
        >
          <div
            style={{
              background: "#111218",
              borderRadius: 999,
              height: 12,
              left: 12,
              position: "absolute",
              top: 12,
              width: 12,
            }}
          />
          <div
            style={{
              background: "#7568ff",
              borderRadius: 999,
              bottom: -5,
              height: 22,
              position: "absolute",
              right: -5,
              width: 22,
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
