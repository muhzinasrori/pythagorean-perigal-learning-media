import { ImageResponse } from "next/og";

/**
 * Dynamic Open Graph image (1200×630) — generated at build time with
 * Satori. Shown when the site URL is shared on WhatsApp, X/Twitter,
 * Facebook, LinkedIn, Slack, etc.
 */

export const alt =
  "Pythagorean Lab — Perigal's Dissection: interactive Grade 8 math lab for the Pythagorean Theorem (a² + b² = c²)";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          background: "linear-gradient(135deg, #fafaf9 0%, #f0fdfa 100%)",
        }}
      >
        {/* Top teal accent bar */}
        <div
          style={{
            width: "100%",
            height: 12,
            background: "#0f766e",
            display: "flex",
          }}
        />

        {/* Main content row */}
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 36,
            padding: "48px 52px",
          }}
        >
          {/* Left column — text */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: 600,
              gap: 24,
            }}
          >
            <div style={{ display: "flex" }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: "#0f766e",
                  background: "#ccfbf1",
                  borderRadius: 999,
                  padding: "10px 22px",
                }}
              >
                GRADE 8 · INTERACTIVE MATHEMATICS
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 58,
                fontWeight: 700,
                color: "#1c1917",
                lineHeight: 1.12,
              }}
            >
              <span>Pythagorean Lab</span>
              <span style={{ color: "#0f766e" }}>Perigal&apos;s Dissection</span>
            </div>

            <div
              style={{
                display: "flex",
                fontSize: 26,
                color: "#57534e",
                lineHeight: 1.45,
              }}
            >
              Cut the square, drag the pieces, and prove a² + b² = c² with your
              own hands — a free guided-discovery lab for the Pythagorean
              Theorem.
            </div>

            {/* Equation chips */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 4,
              }}
            >
              <span
                style={{
                  display: "flex",
                  padding: "10px 24px",
                  borderRadius: 14,
                  fontSize: 34,
                  fontWeight: 700,
                  color: "#92400e",
                  background: "#fef3c7",
                  border: "2px solid #fcd34d",
                }}
              >
                a²
              </span>
              <span style={{ display: "flex", fontSize: 34, color: "#78716c" }}>
                +
              </span>
              <span
                style={{
                  display: "flex",
                  padding: "10px 24px",
                  borderRadius: 14,
                  fontSize: 34,
                  fontWeight: 700,
                  color: "#134e4a",
                  background: "#ccfbf1",
                  border: "2px solid #5eead4",
                }}
              >
                b²
              </span>
              <span style={{ display: "flex", fontSize: 34, color: "#78716c" }}>
                =
              </span>
              <span
                style={{
                  display: "flex",
                  padding: "10px 24px",
                  borderRadius: 14,
                  fontSize: 34,
                  fontWeight: 700,
                  color: "#881337",
                  background: "#ffe4e6",
                  border: "2px solid #fda4af",
                }}
              >
                c²
              </span>
            </div>
          </div>

          {/* Right column — 3-4-5 diagram card */}
          <div
            style={{
              display: "flex",
              background: "#ffffff",
              border: "2px solid #e7e5e4",
              borderRadius: 28,
              padding: 20,
              boxShadow: "0 10px 30px rgba(15,118,110,0.10)",
            }}
          >
            <div
              style={{
                position: "relative",
                width: 396,
                height: 360,
                display: "flex",
              }}
            >
              <svg width="396" height="360" viewBox="0 0 396 360">
                {/* a² square (amber) */}
                <rect
                  x="144"
                  y="252"
                  width="108"
                  height="108"
                  rx="6"
                  fill="#fbbf24"
                  stroke="#d97706"
                  strokeWidth="3"
                />
                {/* b² square (teal) */}
                <rect
                  x="0"
                  y="108"
                  width="144"
                  height="144"
                  rx="6"
                  fill="#14b8a6"
                  stroke="#0f766e"
                  strokeWidth="3"
                />
                {/* c² square (rose) on the hypotenuse */}
                <polygon
                  points="252,252 396,144 288,0 144,108"
                  fill="#fb7185"
                  stroke="#e11d48"
                  strokeWidth="3"
                />
                {/* right triangle */}
                <polygon
                  points="144,252 252,252 144,108"
                  fill="#e7e5e4"
                  stroke="#44403c"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
                {/* right-angle marker */}
                <path
                  d="M144 236 L160 236 L160 252"
                  fill="none"
                  stroke="#44403c"
                  strokeWidth="2.5"
                />
              </svg>

              {/* Area labels (absolutely positioned divs) */}
              <div
                style={{
                  position: "absolute",
                  left: 144,
                  top: 252,
                  width: 108,
                  height: 108,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  fontWeight: 700,
                  color: "#78350f",
                }}
              >
                a² = 9
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 108,
                  width: 144,
                  height: 144,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#ecfdf5",
                }}
              >
                b² = 16
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 173,
                  top: 96,
                  width: 140,
                  height: 60,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  fontWeight: 700,
                  color: "#ffffff",
                }}
              >
                c² = 25
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            left: 52,
            right: 52,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", fontSize: 22, color: "#78716c" }}>
            Free · No account needed · Works on tablet &amp; touch
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#78716c" }}>
            pythagorean-perigal-learning-media.vercel.app
          </div>
        </div>
      </div>
    ),
    size,
  );
}
