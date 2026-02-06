import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AEEG — Association d'élèves d'Émilie Gourd";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0A0A0A",
          backgroundImage:
            "radial-gradient(circle at 0% 0%, rgba(212,168,71,0.09), transparent 44%), radial-gradient(circle at 100% 100%, rgba(91,138,138,0.10), transparent 36%)",
        }}
      >
        <div
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 140,
            fontWeight: 400,
            letterSpacing: "-4px",
            color: "#F5F5F0",
            lineHeight: 1,
          }}
        >
          AEEG
        </div>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 26,
            fontWeight: 500,
            color: "rgba(245,245,240,0.62)",
            marginTop: 20,
          }}
        >
          {"Association d'élèves d'Émilie Gourd"}
        </div>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 18,
            fontWeight: 500,
            letterSpacing: "3px",
            color: "rgba(245,245,240,0.36)",
            marginTop: 16,
            textTransform: "uppercase" as const,
          }}
        >
          Genève
        </div>
      </div>
    ),
    { ...size }
  );
}
