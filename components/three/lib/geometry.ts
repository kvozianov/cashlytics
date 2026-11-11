import * as THREE from "three"
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js"

type P = [number, number]

// Replaces every corner of a polyline with a short quadratic curve, which keeps
// lathe/extrude normals smooth and gives the soft clay edge.
export function roundCorners(points: P[], radius: number, steps = 4, closed = false): THREE.Vector2[] {
  const out: THREE.Vector2[] = []
  const n = points.length
  for (let i = 0; i < n; i++) {
    const p = points[i]
    const hasPrev = closed || i > 0
    const hasNext = closed || i < n - 1
    if (!hasPrev || !hasNext) {
      out.push(new THREE.Vector2(p[0], p[1]))
      continue
    }
    const a = points[(i - 1 + n) % n]
    const b = points[(i + 1) % n]
    const la = Math.hypot(p[0] - a[0], p[1] - a[1])
    const lb = Math.hypot(b[0] - p[0], b[1] - p[1])
    const r = Math.min(radius, la * 0.45, lb * 0.45)
    const s: P = [p[0] + ((a[0] - p[0]) / la) * r, p[1] + ((a[1] - p[1]) / la) * r]
    const e: P = [p[0] + ((b[0] - p[0]) / lb) * r, p[1] + ((b[1] - p[1]) / lb) * r]
    for (let k = 0; k <= steps; k++) {
      const t = k / steps
      const u = 1 - t
      out.push(
        new THREE.Vector2(
          u * u * s[0] + 2 * u * t * p[0] + t * t * e[0],
          u * u * s[1] + 2 * u * t * p[1] + t * t * e[1],
        ),
      )
    }
  }
  return out
}

// The logo: three bars with slanted tops rising to the right (from the 40x40 mark).
const LOGO_BARS: P[][] = [
  [
    [12, 28],
    [16, 28],
    [16, 14],
    [12, 18],
  ],
  [
    [18, 28],
    [22, 28],
    [22, 12],
    [18, 16],
  ],
  [
    [24, 28],
    [28, 28],
    [28, 10],
    [24, 14],
  ],
]

export function logoShapes(size: number) {
  // Centre on the mark and flip y (SVG y grows downward).
  const s = size / 18
  return LOGO_BARS.map((bar) => {
    const pts: P[] = bar.map(([x, y]) => [(x - 20) * s, (19 - y) * s])
    return new THREE.Shape(roundCorners(pts, 0.55 * s, 3, true))
  })
}

function withMark(geo: THREE.BufferGeometry, value: number) {
  const n = geo.getAttribute("position").count
  geo.setAttribute("mark", new THREE.BufferAttribute(new Float32Array(n).fill(value), 1))
  return geo
}

function smoothed(geo: THREE.BufferGeometry) {
  geo.deleteAttribute("uv")
  geo.deleteAttribute("normal")
  const merged = mergeVertices(geo, 1e-4)
  geo.dispose()
  merged.computeVertexNormals()
  return merged
}

type CoinOptions = {
  segments?: number
  emboss?: "both" | "top" | "none"
  profileSteps?: number
}

// Unit-radius coin, axis along +Y: a raised rim, bevelled edge and the bar mark
// raised from the field. Total thickness 0.3.
export function createCoinGeometry({ segments = 64, emboss = "both", profileSteps = 4 }: CoinOptions = {}) {
  const f = 0.085
  const h = 0.15
  const e = 0.1
  const profile = roundCorners(
    [
      [0, -f],
      [0.79, -f],
      [0.84, -h],
      [0.93, -h],
      [1, -e],
      [1, e],
      [0.93, h],
      [0.84, h],
      [0.79, f],
      [0, f],
    ],
    0.035,
    profileSteps,
  )
  const body = new THREE.LatheGeometry(profile, segments)
  body.deleteAttribute("uv")
  const parts: THREE.BufferGeometry[] = [withMark(body, 0)]
  if (emboss !== "none") {
    const shapes = logoShapes(0.95)
    const extrude: THREE.ExtrudeGeometryOptions = {
      depth: 0.045,
      bevelEnabled: true,
      bevelThickness: 0.014,
      bevelSize: 0.012,
      bevelSegments: 2,
      curveSegments: 2,
    }
    const top = new THREE.ExtrudeGeometry(shapes, extrude)
    top.rotateX(-Math.PI / 2)
    top.translate(0, f - 0.006, 0)
    parts.push(withMark(smoothed(top), 1))
    if (emboss === "both") {
      const bottom = new THREE.ExtrudeGeometry(shapes, extrude)
      bottom.rotateX(Math.PI / 2)
      bottom.translate(0, -f + 0.006, 0)
      parts.push(withMark(smoothed(bottom), 1))
    }
  }
  const merged = mergeGeometries(parts, false)
  parts.forEach((p) => p.dispose())
  if (!merged) throw new Error("coin geometry merge failed")
  merged.computeBoundingSphere()
  return merged
}

// A rounded logo bar as a chunky object: slanted top, square cross-section.
export function createBarGeometry(width: number, height: number, slant: number, depth: number) {
  const pts: P[] = [
    [-width / 2, 0],
    [width / 2, 0],
    [width / 2, height],
    [-width / 2, height - slant],
  ]
  const shape = new THREE.Shape(roundCorners(pts, width * 0.12, 4, true))
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: depth - 0.08,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.035,
    bevelSegments: 3,
    curveSegments: 3,
  })
  geo.translate(0, 0, -(depth - 0.08) / 2)
  return smoothed(geo)
}

// Coins carry a `mark` attribute on the embossed bars; this tints them like an
// inked stamp (darker on light coins, lighter on ink ones) so the mark reads head-on.
export function createCoinMaterial(roughness = 0.56) {
  const mat = new THREE.MeshStandardMaterial({ roughness, metalness: 0 })
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nattribute float mark;\nvarying float vMark;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvMark = mark;")
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vMark;")
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
float markLum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
vec3 inked = markLum > 0.08 ? diffuseColor.rgb * 0.6 : diffuseColor.rgb * 2.6 + 0.035;
diffuseColor.rgb = mix(diffuseColor.rgb, inked, vMark);`,
      )
  }
  mat.customProgramCacheKey = () => "coin-ink"
  return mat
}
