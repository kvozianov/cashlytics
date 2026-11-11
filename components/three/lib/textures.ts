import * as THREE from "three"
import { seededRandom } from "./core"

const MONO_FALLBACK = '"DM Mono", ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace'
const HAND_FALLBACK = 'Caveat, "Bradley Hand", "Segoe Print", cursive'

// Picks up whatever family the page's `font-mono` / `font-hand` utilities resolve
// to (next/font hashes the names), so canvas text matches the DOM.
function probeFamily(className: string, fallback: string) {
  if (typeof document === "undefined") return fallback
  const probe = document.createElement("span")
  probe.className = className
  probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none"
  document.body.appendChild(probe)
  const family = getComputedStyle(probe).fontFamily
  const bodyFamily = getComputedStyle(document.body).fontFamily
  probe.remove()
  if (!family || family === bodyFamily) return fallback
  return family
}

export type Fonts = { mono: string; hand: string }

export function resolveFonts(): Fonts {
  return { mono: probeFamily("font-mono", MONO_FALLBACK), hand: probeFamily("font-hand", HAND_FALLBACK) }
}

export async function fontsReady(fonts: Fonts) {
  if (typeof document === "undefined" || !document.fonts) return
  try {
    await Promise.all([document.fonts.load(`500 32px ${fonts.mono}`), document.fonts.load(`600 32px ${fonts.hand}`)])
    await document.fonts.ready
  } catch {
    // fall back to whatever is available
  }
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas")
  c.width = w
  c.height = h
  const ctx = c.getContext("2d")
  if (!ctx) throw new Error("2d canvas unavailable")
  return { c, ctx }
}

function spaced(ctx: CanvasRenderingContext2D, px: number) {
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px}px`
}

function paperGrain(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
  amount = 1,
) {
  const rnd = seededRandom(seed)
  const n = Math.floor(((w * h) / 900) * amount)
  for (let i = 0; i < n; i++) {
    const a = rnd() * 0.05
    ctx.fillStyle = rnd() > 0.5 ? `rgba(80,64,40,${a})` : `rgba(255,255,255,${a * 1.5})`
    ctx.fillRect(x + rnd() * w, y + rnd() * h, 1 + rnd() * 2.5, 1 + rnd() * 2.5)
  }
}

// Rough highlighter stroke: wobbly edges, darker overlap at the ends.
function markerStroke(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  seed: number,
) {
  const rnd = seededRandom(seed)
  ctx.save()
  ctx.globalCompositeOperation = "multiply"
  ctx.fillStyle = color
  for (let pass = 0; pass < 2; pass++) {
    ctx.globalAlpha = pass === 0 ? 0.9 : 0.35
    ctx.beginPath()
    const steps = 14
    const tilt = (rnd() - 0.5) * h * 0.25
    for (let i = 0; i <= steps; i++) {
      const px = x + (w * i) / steps
      ctx.lineTo(px, y + (rnd() - 0.5) * h * 0.12 + tilt * (i / steps) + pass * 2)
    }
    ctx.lineTo(x + w + h * 0.15, y + h * 0.5)
    for (let i = steps; i >= 0; i--) {
      const px = x + (w * i) / steps
      ctx.lineTo(px, y + h + (rnd() - 0.5) * h * 0.12 + tilt * (i / steps) - pass * 2)
    }
    ctx.lineTo(x - h * 0.12, y + h * 0.55)
    ctx.closePath()
    ctx.fill()
  }
  ctx.restore()
}

function handEllipse(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  color: string,
  width: number,
  seed: number,
) {
  const rnd = seededRandom(seed)
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.beginPath()
  const turns = 1.18
  const steps = 90
  const start = -2.2
  for (let i = 0; i <= steps; i++) {
    const t = start + (i / steps) * Math.PI * 2 * turns
    const wob = 1 + (rnd() - 0.5) * 0.025 + (i / steps) * 0.07
    const x = cx + Math.cos(t) * rx * wob
    const y = cy + Math.sin(t) * ry * wob - (i / steps) * ry * 0.18
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()
  ctx.restore()
}

function leaderRow(
  ctx: CanvasRenderingContext2D,
  left: string,
  right: string,
  x0: number,
  x1: number,
  y: number,
  dot: string,
) {
  ctx.textAlign = "left"
  ctx.fillText(left, x0, y)
  const lw = ctx.measureText(left).width
  ctx.textAlign = "right"
  ctx.fillText(right, x1, y)
  const rw = ctx.measureText(right).width
  ctx.save()
  ctx.fillStyle = dot
  const gap = 11
  for (let x = x0 + lw + 12; x < x1 - rw - 10; x += gap) ctx.fillRect(x, y - 3, 3, 3)
  ctx.restore()
}

export const RECEIPT_ROWS: [string, string][] = [
  ["SQ *BLUE BOTTLE 0423", "5.40"],
  ["ADOBE *CREATIVE CLOUD", "59.99"],
  ["TST* NORTHSIDE PIZZA", "23.80"],
  ["CITY TRANSIT FARE", "2.90"],
  ["PAYPAL *STUDIOFONTS", "18.00"],
  ["MAPLE ST GROCERS", "64.17"],
  ["COWORK DESK / DAY", "25.00"],
  ["SQ *BLUE BOTTLE 0427", "5.40"],
]

export const RECEIPT_ASPECT = 1.62 / 4.3

export function paintReceipt(fonts: Fonts, width: number) {
  const W = width
  const H = Math.round(W / RECEIPT_ASPECT)
  const { c, ctx } = makeCanvas(W, H)
  const u = W / 1024
  const tooth = 34 * u

  // paper with zig-zag tear at both ends
  ctx.beginPath()
  ctx.moveTo(0, tooth)
  for (let x = 0; x < W; x += tooth) {
    ctx.lineTo(x + tooth / 2, 0)
    ctx.lineTo(Math.min(W, x + tooth), tooth)
  }
  ctx.lineTo(W, H - tooth)
  for (let x = W; x > 0; x -= tooth) {
    ctx.lineTo(x - tooth / 2, H)
    ctx.lineTo(Math.max(0, x - tooth), H - tooth)
  }
  ctx.closePath()
  ctx.fillStyle = "#FBF9F4"
  ctx.fill()
  ctx.save()
  ctx.clip()
  paperGrain(ctx, 0, 0, W, H, 7, 1.2)
  ctx.strokeStyle = "rgba(20,19,15,0.16)"
  ctx.lineWidth = 7 * u
  ctx.stroke()
  ctx.restore()

  const ink = "#14130F"
  const soft = "rgba(20,19,15,0.55)"
  const m = 78 * u
  const x0 = m
  const x1 = W - m
  let y = 150 * u

  ctx.fillStyle = ink
  ctx.textBaseline = "alphabetic"
  ctx.textAlign = "center"
  ctx.font = `500 ${64 * u}px ${fonts.mono}`
  spaced(ctx, 14 * u)
  ctx.fillText("CASHLYTICS", W / 2 + 7 * u, y)
  spaced(ctx, 4 * u)
  y += 58 * u
  ctx.font = `400 ${28 * u}px ${fonts.mono}`
  ctx.fillStyle = soft
  ctx.fillText("STATEMENT · OCT 2026", W / 2, y)
  y += 40 * u
  ctx.fillText("FICTIONAL DATA", W / 2, y)
  spaced(ctx, 0)

  y += 46 * u
  ctx.fillStyle = soft
  for (let x = x0; x < x1; x += 22 * u) ctx.fillRect(x, y, 12 * u, 3 * u)

  y += 78 * u
  const rowH = 76 * u
  ctx.font = `400 ${33 * u}px ${fonts.mono}`
  RECEIPT_ROWS.forEach(([name, amount], i) => {
    if (i === 1) markerStroke(ctx, x0 - 18 * u, y - 40 * u, x1 - x0 + 30 * u, 54 * u, "#D6F84C", 11)
    ctx.fillStyle = ink
    leaderRow(ctx, name, amount, x0, x1, y, "rgba(20,19,15,0.4)")
    if (i === 1) {
      ctx.save()
      ctx.font = `600 ${44 * u}px ${fonts.hand}`
      ctx.fillStyle = "#F0502D"
      ctx.textAlign = "right"
      ctx.translate(x1 - 6 * u, y + 46 * u)
      ctx.rotate(-0.06)
      ctx.fillText("cancel? ↑", 0, 0)
      ctx.restore()
      y += 34 * u
    }
    y += rowH
  })

  y += 4 * u
  ctx.fillStyle = soft
  for (let x = x0; x < x1; x += 22 * u) ctx.fillRect(x, y - 28 * u, 12 * u, 3 * u)
  y += 46 * u
  ctx.fillStyle = soft
  ctx.font = `400 ${28 * u}px ${fonts.mono}`
  leaderRow(ctx, "ITEMS", String(RECEIPT_ROWS.length), x0, x1, y, "rgba(20,19,15,0.3)")
  y += 84 * u
  ctx.fillStyle = ink
  ctx.font = `500 ${46 * u}px ${fonts.mono}`
  const total = RECEIPT_ROWS.reduce((s, [, a]) => s + Number(a), 0).toFixed(2)
  leaderRow(ctx, "TOTAL", total, x0, x1, y, "rgba(20,19,15,0.45)")
  const tw = ctx.measureText(total).width
  handEllipse(ctx, x1 - tw / 2, y - 16 * u, tw / 2 + 34 * u, 44 * u, "#F0502D", 6 * u, 3)

  y += 120 * u
  // barcode
  const rnd = seededRandom(42)
  ctx.fillStyle = ink
  let bx = x0 + 40 * u
  while (bx < x1 - 40 * u) {
    const bw = (rnd() < 0.3 ? 7 : 3) * u
    ctx.fillRect(bx, y, bw, 86 * u)
    bx += bw + (rnd() < 0.5 ? 5 : 9) * u
  }
  y += 130 * u
  ctx.fillStyle = soft
  ctx.textAlign = "center"
  ctx.font = `400 ${26 * u}px ${fonts.mono}`
  spaced(ctx, 4 * u)
  ctx.fillText("SORTED · TOTALLED · ANNOTATED", W / 2, y)
  spaced(ctx, 0)

  return c
}

export function paintLabel(fonts: Fonts, w: number, h: number) {
  const { c, ctx } = makeCanvas(w, h)
  const u = w / 1024
  ctx.fillStyle = "#FBF9F4"
  ctx.fillRect(0, 0, w, h)
  paperGrain(ctx, 0, 0, w, h, 19, 1.4)
  ctx.strokeStyle = "rgba(20,19,15,0.85)"
  ctx.lineWidth = 5 * u
  ctx.strokeRect(34 * u, 30 * u, w - 68 * u, h - 60 * u)
  ctx.lineWidth = 2 * u
  ctx.strokeRect(48 * u, 44 * u, w - 96 * u, h - 88 * u)

  ctx.fillStyle = "rgba(20,19,15,0.6)"
  ctx.font = `400 ${26 * u}px ${fonts.mono}`
  ctx.textAlign = "left"
  spaced(ctx, 4 * u)
  ctx.fillText("02 — PLAN", 90 * u, 112 * u)
  ctx.textAlign = "right"
  ctx.fillText("NO. 04", w - 90 * u, 112 * u)

  ctx.fillStyle = "#14130F"
  ctx.textAlign = "center"
  ctx.font = `500 ${94 * u}px ${fonts.mono}`
  spaced(ctx, 10 * u)
  ctx.fillText("TAX RESERVE", w / 2 + 5 * u, h * 0.56)
  spaced(ctx, 4 * u)
  ctx.fillStyle = "rgba(20,19,15,0.25)"
  ctx.fillRect(90 * u, h * 0.64, w - 180 * u, 2 * u)
  ctx.fillStyle = "rgba(20,19,15,0.6)"
  ctx.font = `400 ${26 * u}px ${fonts.mono}`
  ctx.fillText("SET ASIDE FROM EVERY INVOICE", w / 2, h * 0.75)
  spaced(ctx, 0)
  return c
}

// Lime marker tick plus a grease-pencil note, drawn on the glass.
export function paintNeededMark(fonts: Fonts, w: number, h: number, textColor: string) {
  const { c, ctx } = makeCanvas(w, h)
  const u = w / 512
  markerStroke(ctx, 10 * u, h * 0.5 - 14 * u, 250 * u, 28 * u, "#D6F84C", 5)
  ctx.globalCompositeOperation = "source-over"
  // pencil tick over the highlighter so the line still reads against lime coins
  const rnd = seededRandom(12)
  ctx.strokeStyle = textColor
  ctx.lineWidth = 4 * u
  ctx.lineCap = "round"
  ctx.beginPath()
  ctx.moveTo(6 * u, h * 0.5 - 16 * u)
  ctx.lineTo(6 * u, h * 0.5 + 1 * u)
  for (let x = 6; x <= 256; x += 25) ctx.lineTo(x * u, h * 0.5 + (rnd() - 0.5) * 2.5 * u)
  ctx.stroke()
  ctx.fillStyle = textColor
  ctx.font = `600 ${74 * u}px ${fonts.hand}`
  ctx.textAlign = "left"
  ctx.textBaseline = "middle"
  ctx.fillText("needed", 276 * u, h * 0.5 + 4 * u)
  return c
}

export function paintStamp(fonts: Fonts, size: number) {
  const { c, ctx } = makeCanvas(size, size)
  const u = size / 256
  const color = "#F0502D"
  ctx.translate(size / 2, size / 2)
  ctx.rotate(-0.12)
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 9 * u
  ctx.beginPath()
  ctx.arc(0, 0, 112 * u, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 3.5 * u
  ctx.beginPath()
  ctx.arc(0, 0, 94 * u, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 16 * u
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  ctx.beginPath()
  ctx.moveTo(-42 * u, -14 * u)
  ctx.lineTo(-10 * u, 18 * u)
  ctx.lineTo(48 * u, -42 * u)
  ctx.stroke()
  ctx.font = `500 ${25 * u}px ${fonts.mono}`
  ctx.textAlign = "center"
  ctx.fillText("COVERED", 0, 62 * u)
  // uneven ink
  const rnd = seededRandom(9)
  ctx.globalCompositeOperation = "destination-out"
  for (let i = 0; i < 260; i++) {
    ctx.globalAlpha = rnd() * 0.6
    const r = (1 + rnd() * 4) * u
    ctx.beginPath()
    ctx.arc((rnd() - 0.5) * 240 * u, (rnd() - 0.5) * 240 * u, r, 0, Math.PI * 2)
    ctx.fill()
  }
  return c
}

// Height canvas (white = raised) to a tangent-space normal map.
export function heightToNormal(src: HTMLCanvasElement, strength: number) {
  const w = src.width
  const h = src.height
  const sctx = src.getContext("2d")!
  const data = sctx.getImageData(0, 0, w, h).data
  const height = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) height[i] = data[i * 4] / 255
  const { c, ctx } = makeCanvas(w, h)
  const out = ctx.createImageData(w, h)
  const o = out.data
  const at = (x: number, y: number) => height[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))]
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx =
        (at(x + 1, y - 1) +
          2 * at(x + 1, y) +
          at(x + 1, y + 1) -
          at(x - 1, y - 1) -
          2 * at(x - 1, y) -
          at(x - 1, y + 1)) *
        strength
      const dy =
        (at(x - 1, y + 1) +
          2 * at(x, y + 1) +
          at(x + 1, y + 1) -
          at(x - 1, y - 1) -
          2 * at(x, y - 1) -
          at(x + 1, y - 1)) *
        strength
      const len = Math.hypot(dx, dy, 1)
      const i = (y * w + x) * 4
      o[i] = ((-dx / len) * 0.5 + 0.5) * 255
      o[i + 1] = ((dy / len) * 0.5 + 0.5) * 255
      o[i + 2] = ((1 / len) * 0.5 + 0.5) * 255
      o[i + 3] = 255
    }
  }
  ctx.putImageData(out, 0, 0)
  return c
}

// The legend face of the big coin: text around the rim, a name in the middle.
export function paintCoinLegend(fonts: Fonts, size: number, kind: "height" | "color") {
  const { c, ctx } = makeCanvas(size, size)
  const u = size / 1024
  const raised = kind === "height" ? "#ffffff" : "rgba(20,19,15,0.30)"
  ctx.fillStyle = kind === "height" ? "#000000" : "#ffffff"
  ctx.fillRect(0, 0, size, size)
  if (kind === "height") ctx.filter = `blur(${2.2 * u}px)`
  ctx.translate(size / 2, size / 2)
  ctx.fillStyle = raised
  ctx.strokeStyle = raised

  const text = "MANAGE · PLAN · LEARN · "
  ctx.font = `500 ${84 * u}px ${fonts.mono}`
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  const r = 396 * u
  const chars = [...text]
  const step = (Math.PI * 2) / chars.length
  chars.forEach((ch, i) => {
    ctx.save()
    ctx.rotate(i * step)
    ctx.translate(0, -r)
    ctx.fillText(ch, 0, 0)
    ctx.restore()
  })
  ctx.lineWidth = 7 * u
  ctx.beginPath()
  ctx.arc(0, 0, 316 * u, 0, Math.PI * 2)
  ctx.stroke()
  for (let i = 0; i < 48; i++) {
    ctx.save()
    ctx.rotate((i / 48) * Math.PI * 2)
    ctx.fillRect(-3 * u, -296 * u, 6 * u, 18 * u)
    ctx.restore()
  }
  ctx.font = `500 ${72 * u}px ${fonts.mono}`
  spaced(ctx, 6 * u)
  ctx.fillText("CASHLYTICS", 3 * u, -6 * u)
  spaced(ctx, 0)
  ctx.fillRect(-150 * u, 62 * u, 300 * u, 7 * u)
  ctx.fillRect(-150 * u, -78 * u, 300 * u, 7 * u)
  ctx.font = `400 ${46 * u}px ${fonts.mono}`
  ctx.fillText("2026", 0, 132 * u)
  ctx.filter = "none"
  return c
}

export function paintCork(size: number) {
  const { c, ctx } = makeCanvas(size, size)
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, size, size)
  const rnd = seededRandom(5)
  for (let i = 0; i < size * 10; i++) {
    const v = rnd()
    ctx.fillStyle = v > 0.5 ? `rgba(90,55,25,${0.06 + rnd() * 0.16})` : `rgba(255,240,215,${rnd() * 0.25})`
    const r = 0.4 + rnd() * rnd() * 2.4
    ctx.beginPath()
    ctx.ellipse(rnd() * size, rnd() * size, r * 1.6, r, rnd() * 3, 0, Math.PI * 2)
    ctx.fill()
  }
  return c
}

export function toTexture(canvas: HTMLCanvasElement, opts: { srgb?: boolean; anisotropy?: number } = {}) {
  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = opts.srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace
  t.anisotropy = opts.anisotropy ?? 4
  t.needsUpdate = true
  return t
}
