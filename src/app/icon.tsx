import { ImageResponse } from "next/og";

export const size = { width: 48, height: 48 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          borderRadius: "11px",
          color: "#0c0e12",
          fontWeight: 900,
          fontSize: "24px",
          letterSpacing: "-1.5px",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          position: "relative",
        }}
      >
        MP
        <div
          style={{
            position: "absolute",
            top: "6px",
            right: "6px",
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            backgroundColor: "#2563eb",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}

