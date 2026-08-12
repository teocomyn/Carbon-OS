import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
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
          borderRadius: 42,
          display: "flex",
          height: 104,
          position: "relative",
          width: 104,
        }}
      >
        <div
          style={{
            background: "#111218",
            borderRadius: 999,
            height: 34,
            left: 35,
            position: "absolute",
            top: 35,
            width: 34,
          }}
        />
        <div
          style={{
            background: "#236c50",
            borderRadius: 999,
            bottom: -13,
            height: 62,
            position: "absolute",
            right: -13,
            width: 62,
          }}
        />
      </div>
    </div>,
    size,
  );
}
