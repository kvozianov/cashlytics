import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { ImageResponse } from "next/og"

export const alt = "Cashlytics — Manage your money. Plan your tax. Learn what to fix. Concept prototype with a live demo."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const INK = "#14130F"
const PAPER = "#F2EEE6"
const LIME = "#D6F84C"
const STAMP = "#BF3418"

export default async function OpengraphImage() {
  // Bricolage Grotesque Bold (SIL OFL 1.1, see app/_fonts/OFL.txt), the site's display face.
  const display = await readFile(join(process.cwd(), "app/_fonts/BricolageGrotesque-Bold.ttf"))
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px 64px",
          background: PAPER,
          color: INK,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `2px solid ${INK}`, paddingBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <svg width="44" height="44" viewBox="0 0 32 32">
              <path d="M2 30V21.5L8 19V30Z" fill={INK} />
              <path d="M12 30V15.5L18 13V30Z" fill={INK} />
              <path d="M22 30V11.5L28 9V30Z" fill={INK} />
              <circle cx="25.5" cy="7" r="4.75" fill={LIME} stroke={INK} strokeWidth="2" />
            </svg>
            <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: 34, letterSpacing: -1 }}>Cashlytics</div>
          </div>
          <div style={{ display: "flex", fontSize: 20, letterSpacing: 4, color: "#5F5B50" }}>CONCEPT PROTOTYPE · LIVE DEMO</div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", fontFamily: "Bricolage", fontSize: 104, lineHeight: 0.98, letterSpacing: -4 }}>
            <div style={{ display: "flex" }}>
              Manage your&nbsp;
              <span style={{ display: "flex", background: LIME, padding: "0 10px", margin: "0 -10px" }}>money.</span>
            </div>
            <div style={{ display: "flex" }}>Plan your tax.</div>
            <div style={{ display: "flex" }}>Learn what to fix.</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 17, letterSpacing: 3, color: "#5F5B50", whiteSpace: "nowrap" }}>
            NO SIGN-UP / FICTIONAL DATA / RUNS IN YOUR BROWSER
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: 6,
              border: `4px solid ${STAMP}`,
              color: STAMP,
              background: PAPER,
              transform: "rotate(-3deg)",
              letterSpacing: 4,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "10px 22px",
                border: `2px solid ${STAMP}`,
              }}
            >
              <div style={{ display: "flex", fontSize: 32 }}>1ST PLACE</div>
              <div style={{ display: "flex", fontSize: 22 }}>TEENMBA FINAL 2026</div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Bricolage", data: display, weight: 700, style: "normal" }] },
  )
}
