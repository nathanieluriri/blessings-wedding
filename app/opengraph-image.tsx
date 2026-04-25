import { ImageResponse } from "next/og";

export const alt =
  "Blessing & Justice — A Wedding Invitation. 19 December 2026 · Acropolis Park, Apo. #OfoDiMma";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
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
          background:
            "radial-gradient(circle at 30% 25%, #f7f0e6 0%, #efe4d2 55%, #e6d5b8 100%)",
          fontFamily: "Georgia, serif",
          color: "#2a1a14",
          padding: "80px 100px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 24,
            border: "2px solid #c9a96b",
            borderRadius: 8,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 36,
            border: "1px solid rgba(201, 169, 107, 0.55)",
            borderRadius: 4,
            display: "flex",
          }}
        />

        <div
          style={{
            fontSize: 24,
            letterSpacing: 16,
            textTransform: "uppercase",
            color: "#5a1a1a",
            marginBottom: 32,
            display: "flex",
          }}
        >
          Together with their families
        </div>

        <div
          style={{
            fontSize: 132,
            fontStyle: "italic",
            color: "#2a1a14",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Blessing
        </div>
        <div
          style={{
            fontSize: 64,
            fontStyle: "italic",
            color: "#c9a96b",
            margin: "8px 0",
            display: "flex",
          }}
        >
          &
        </div>
        <div
          style={{
            fontSize: 132,
            fontStyle: "italic",
            color: "#2a1a14",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Justice
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginTop: 44,
          }}
        >
          <div
            style={{
              width: 80,
              height: 1,
              background: "#c9a96b",
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 28,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#5a1a1a",
              display: "flex",
            }}
          >
            19 · 12 · 2026
          </div>
          <div
            style={{
              width: 80,
              height: 1,
              background: "#c9a96b",
              display: "flex",
            }}
          />
        </div>

        <div
          style={{
            fontSize: 22,
            letterSpacing: 4,
            color: "#7a2a2a",
            marginTop: 18,
            display: "flex",
          }}
        >
          Acropolis Park · Apo
        </div>

        <div
          style={{
            fontSize: 30,
            fontStyle: "italic",
            color: "#c9a96b",
            marginTop: 36,
            display: "flex",
          }}
        >
          #OfoDiMma
        </div>
      </div>
    ),
    { ...size },
  );
}
