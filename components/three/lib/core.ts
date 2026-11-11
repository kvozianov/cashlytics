import * as THREE from "three"

export const PAPER = "#F2EEE6"
export const CARD = "#FBF9F4"
export const INK = "#14130F"
export const LIME = "#D6F84C"
export const GREEN = "#0E7C4A"
export const VERMILION = "#F0502D"

export type Palette = {
  dark: boolean
  ink: string
  inkText: string
  lime: string
  green: string
  paper: string
  paperBack: string
  cork: string
  shadow: string
  shadowOpacity: number
  hemiSky: string
  hemiGround: string
  hemi: number
  key: number
  fill: number
  rim: number
  env: number
}

// Objects keep their real colours in both themes; on ink the "ink" objects are
// lifted a few steps and a rim light separates them from the page.
export function getPalette(dark: boolean): Palette {
  return dark
    ? {
        dark,
        // "ink" objects turn bone on the ink page, the way a print inverts
        ink: "#D9D3C4",
        inkText: "#EFEBE1",
        lime: LIME,
        green: "#169B5F",
        paper: CARD,
        paperBack: "#E4DED0",
        cork: "#C59B70",
        shadow: "#000000",
        shadowOpacity: 0.7,
        hemiSky: "#FFF6E6",
        hemiGround: "#2A2620",
        hemi: 0.7,
        key: 2.4,
        fill: 0.6,
        rim: 2.6,
        env: 0.9,
      }
    : {
        dark,
        ink: "#24221D",
        inkText: INK,
        lime: LIME,
        green: GREEN,
        paper: CARD,
        paperBack: "#EAE4D6",
        cork: "#C9A27A",
        shadow: "#3A3326",
        shadowOpacity: 0.42,
        hemiSky: "#FFFFFF",
        hemiGround: "#C9BFA9",
        hemi: 0.7,
        key: 2.2,
        fill: 0.7,
        rim: 1.1,
        env: 0.85,
      }
}

// mulberry32: small, fast and identical on every load
export function seededRandom(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const clamp = THREE.MathUtils.clamp

export function smoothstep(e0: number, e1: number, x: number) {
  const t = clamp((x - e0) / (e1 - e0), 0, 1)
  return t * t * (3 - 2 * t)
}

// Frame-rate independent exponential approach.
export function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt))
}

// 1 at t = 0, settles to 0 with a little overshoot by ~1.2 s.
export function settle(t: number) {
  if (t <= 0) return 1
  return Math.exp(-5.2 * t) * Math.cos(7.5 * t)
}

export type Quality = "high" | "low"

export function guessQuality(): Quality {
  if (typeof navigator === "undefined") return "high"
  const cores = navigator.hardwareConcurrency || 4
  const coarse = typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  if (coarse || cores <= 4 || (mem !== undefined && mem <= 4)) return "low"
  return "high"
}

export function refineQuality(base: Quality, gl: THREE.WebGLRenderer): Quality {
  if (base === "low") return "low"
  const caps = gl.capabilities
  if (caps.maxTextureSize < 8192 || caps.maxSamples < 4) return "low"
  return "high"
}
