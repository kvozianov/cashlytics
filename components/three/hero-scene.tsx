"use client"

import { useEffect, useMemo, useRef } from "react"
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber"
import { ContactShadows } from "@react-three/drei"
import * as THREE from "three"
import { HeroFallback } from "./fallbacks"
import { SceneShell, type SceneState } from "./lib/scene-shell"
import { clamp, damp, settle, smoothstep } from "./lib/core"
import { createBarGeometry, createCoinGeometry, createCoinMaterial } from "./lib/geometry"
import { useDisposable } from "./lib/hooks"
import { createReceiptMaterial } from "./lib/receipt-material"
import { fontsReady, paintReceipt, RECEIPT_ASPECT, resolveFonts, toTexture } from "./lib/textures"

type Tone = "lime" | "ink" | "green"
type CoinDef = {
  p: [number, number, number]
  r: [number, number, number]
  s: number
  tone: Tone
  air?: boolean
  // position used when the canvas is wide and the headline owns its left side
  pw?: [number, number, number]
  rise: number
  drift: number
  delay: number
}

const GROUND = -2.2
const STACK: [number, number, number] = [1.6, GROUND, 0.7]
const BARS = { x: -1.35, z: 0.5, rotY: 0.55, w: 0.46, slant: 0.2, heights: [1.0, 1.45, 1.9] }
const BAR_TILT = Math.atan2(BARS.slant, BARS.w)

const COINS: CoinDef[] = [
  // the stack, bottom to top
  {
    p: [STACK[0], GROUND + 0.078, STACK[2]],
    r: [0.02, 0.3, -0.01],
    s: 0.52,
    tone: "ink",
    rise: 0.9,
    drift: 0.5,
    delay: 0.32,
  },
  {
    p: [STACK[0] + 0.05, GROUND + 0.232, STACK[2] - 0.03],
    r: [-0.03, 1.4, 0.03],
    s: 0.52,
    tone: "green",
    rise: 1.25,
    drift: 0.65,
    delay: 0.4,
  },
  {
    p: [STACK[0] - 0.03, GROUND + 0.386, STACK[2] + 0.04],
    r: [0.04, 2.2, 0.02],
    s: 0.52,
    tone: "ink",
    rise: 1.6,
    drift: 0.8,
    delay: 0.48,
  },
  {
    p: [STACK[0] + 0.02, GROUND + 0.545, STACK[2]],
    r: [-0.05, 0.4, -0.06],
    s: 0.52,
    tone: "lime",
    rise: 2.0,
    drift: 0.95,
    delay: 0.56,
  },
  // scattered on the desk
  { p: [0.3, GROUND + 0.09, 1.55], r: [0.12, -0.5, 0.06], s: 0.46, tone: "green", rise: 1.1, drift: 0.3, delay: 0.62 },
  { p: [2.55, GROUND + 0.37, 0.15], r: [0.2, 0.4, 1.0], s: 0.48, tone: "lime", rise: 1.4, drift: 1.1, delay: 0.7 },
  // tumbling in the air
  { p: [-0.95, 1.75, 0.7], pw: [2.35, 2.3, 0.4], r: [0.9, 0.3, 0.4], s: 0.44, tone: "lime", air: true, rise: 2.2, drift: 0.5, delay: 0.2 },
  { p: [2.55, 1.25, 0.1], pw: [2.6, 0.45, 0.2], r: [-0.6, -0.4, -0.3], s: 0.5, tone: "ink", air: true, rise: 2.6, drift: 0.9, delay: 0.26 },
]
// resting on the tallest bar (position is relative to the bars group)
const BAR_COIN = COINS.length
const COUNT = COINS.length + 1

const DESIGN_W = 5.5
const DESIGN_H = 6.1
const DESIGN_CX = 0.45
// wide layout: local extents of everything above the ground row, measured from the
// composition origin (receipt edge on the left, the outermost coins on the right)
const UPPER_LEFT = 0.85
const UPPER_RIGHT = 3.7

function toneColor(tone: Tone, palette: SceneState["palette"]) {
  return tone === "lime" ? palette.lime : tone === "green" ? palette.green : palette.ink
}

function HeroContent({ scene }: { scene: SceneState }) {
  const { reduced, quality, palette } = scene
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)

  const layout = useRef<THREE.Group>(null)
  const lean = useRef<THREE.Group>(null)
  const receipt = useRef<THREE.Mesh>(null)
  const bars = useRef<THREE.Group>(null)
  const coins = useRef<THREE.InstancedMesh>(null)
  const shadow = useRef<THREE.Group>(null)
  const viewport = useThree((s) => s.viewport)

  const coinGeo = useDisposable(() => createCoinGeometry({ segments: quality === "low" ? 40 : 64 }), [quality])
  const barGeos = useMemo(() => BARS.heights.map((h) => createBarGeometry(BARS.w, h, BARS.slant, BARS.w)), [])
  useEffect(() => () => barGeos.forEach((g) => g.dispose()), [barGeos])
  const receiptGeo = useDisposable(() => new THREE.PlaneGeometry(1.62, 1.62 / RECEIPT_ASPECT, 16, 90), [])
  const coinMat = useDisposable(() => createCoinMaterial(), [])
  const barMat = useDisposable(() => new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0 }), [])
  const paper = useDisposable(() => createReceiptMaterial(null, palette.paperBack), [])
  const paperMat = paper.material

  // receipt face, painted once the page fonts are in
  useEffect(() => {
    let tex: THREE.CanvasTexture | null = null
    let cancelled = false
    const fonts = resolveFonts()
    fontsReady(fonts).then(() => {
      if (cancelled) return
      tex = toTexture(paintReceipt(fonts, quality === "low" ? 768 : 1024), {
        anisotropy: Math.min(8, gl.capabilities.getMaxAnisotropy()),
      })
      paperMat.map = tex
      paperMat.needsUpdate = true
      invalidate()
    })
    return () => {
      cancelled = true
      tex?.dispose()
    }
  }, [gl, invalidate, paperMat, quality])

  useEffect(() => {
    barMat.color.set(palette.ink)
    paper.uniforms.uBack.value.set(palette.paperBack)
    const mesh = coins.current
    if (!mesh) return
    const c = new THREE.Color()
    for (let i = 0; i < COUNT; i++) {
      const tone = i === BAR_COIN ? "lime" : COINS[i].tone
      mesh.setColorAt(i, c.set(toneColor(tone, palette)))
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    invalidate()
  }, [palette, barMat, paper, invalidate])

  // per-coin flick state: angle, velocity, hop height, hop velocity
  const flick = useMemo(() => new Float32Array(COUNT * 4), [])
  const pointer = useRef({ x: 0, y: 0 })
  const smooth = useRef({ lx: 0, ly: 0, scroll: 0, t0: -1 })
  const temp = useMemo(
    () => ({
      o: new THREE.Object3D(),
      q: new THREE.Quaternion(),
      e: new THREE.Euler(),
      v: new THREE.Vector3(),
      axis: new THREE.Vector3(1, 0, 0),
      barQ: new THREE.Quaternion(),
      barTop: new THREE.Vector3(),
    }),
    [],
  )

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => window.removeEventListener("pointermove", onMove)
  }, [])

  const onCoinClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.instanceId === undefined || reduced) return
    e.stopPropagation()
    const k = e.instanceId * 4
    flick[k + 1] = Math.min(flick[k + 1] + 17, 34)
    if (flick[k + 2] <= 0.001) flick[k + 3] = 3.8
  }

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30)
    const sm = smooth.current
    if (sm.t0 < 0) sm.t0 = state.clock.elapsedTime
    const t = reduced ? 10 : state.clock.elapsedTime - sm.t0

    // layout from the canvas aspect, not the window
    const vw = state.viewport.width
    const vh = state.viewport.height
    const aspect = state.size.width / Math.max(1, state.size.height)
    const wide = smoothstep(0.9, 1.08, aspect)
    // narrow: centred and fitted
    const sNarrow = Math.min(1, (vw * 0.94) / DESIGN_W, (vh * 0.92) / DESIGN_H)
    // wide: the headline owns the left part of the canvas in its top ~60% (about 45%
    // of a half-page canvas, 68% of a full-bleed one), so every upper object stays
    // right of that line with room for float and parallax; the ground row (bars,
    // desk coins) may reach further left, below the headline
    const safeFrac = THREE.MathUtils.lerp(0.42, 0.68, smoothstep(1.1, 1.8, aspect))
    const safeX = vw * (safeFrac - 0.5) + 0.4
    const sWide = Math.min(1, (vh * 0.9) / DESIGN_H, (vw / 2 - 0.3 - safeX) / (UPPER_LEFT + UPPER_RIGHT))
    const scale = THREE.MathUtils.lerp(sNarrow, sWide, wide)
    const g = layout.current!
    g.scale.setScalar(scale)
    g.position.set(
      THREE.MathUtils.lerp(-DESIGN_CX * sNarrow, safeX + UPPER_LEFT * sWide, wide),
      -0.42 * scale - 0.03 * vh * (1 - wide),
      0,
    )
    // drei's blur pass assumes the shadow sits at the world origin in x/z
    shadow.current!.position.set(0, g.position.y + (GROUND - 0.02) * scale, 0)

    const scrollTarget = reduced ? 0 : clamp(window.scrollY / Math.max(1, window.innerHeight), 0, 1.4)
    sm.scroll = reduced ? 0 : damp(sm.scroll, scrollTarget, 6, dt)
    const sp = sm.scroll
    sm.lx = reduced ? 0 : damp(sm.lx, pointer.current.x, 3, dt)
    sm.ly = reduced ? 0 : damp(sm.ly, pointer.current.y, 3, dt)
    lean.current!.rotation.set(sm.ly * 0.07, sm.lx * 0.13, 0)
    lean.current!.position.set(sm.lx * 0.12, -sm.ly * 0.08, 0)

    const floatOn = reduced ? 0 : 1

    // receipt
    paper.uniforms.uTime.value = t
    paper.uniforms.uAmp.value = 0.045 + Math.sin(t * 0.5) * 0.015 * floatOn
    const r = receipt.current!
    const ri = 5 * settle(t - 0.05)
    r.position.set(0.3 + sp * 0.35, 0.62 + Math.sin(t * 0.7) * 0.08 * floatOn + sp * 0.55 + ri, -0.45 - sp * 0.5)
    r.rotation.set(
      -0.05 - sp * 0.7 + Math.sin(t * 0.55 + 1) * 0.025 * floatOn,
      0.26 - sp * 0.3,
      -0.13 + Math.sin(t * 0.45) * 0.02 * floatOn - ri * 0.04,
    )

    // bars
    const b = bars.current!
    const bi = 4 * settle(t - 0.12)
    b.position.set(BARS.x - sp * 0.75, GROUND + Math.sin(t * 0.8 + 2) * 0.05 * floatOn - sp * 0.15 + bi, BARS.z)
    b.rotation.set(0, BARS.rotY + sp * 0.35 + Math.sin(t * 0.5 + 2) * 0.03 * floatOn, 0)

    // coins
    const mesh = coins.current!
    const { o, q, e, axis, barQ, barTop } = temp
    for (let i = 0; i < COUNT; i++) {
      const k = i * 4
      let angle = flick[k]
      let vel = flick[k + 1]
      if (Math.abs(vel) > 5) vel *= Math.exp(-1.3 * dt)
      else {
        const target = Math.round(angle / Math.PI) * Math.PI
        vel += ((target - angle) * 70 - vel * 10) * dt
      }
      angle += vel * dt
      let hy = flick[k + 2]
      let hv = flick[k + 3]
      if (hv !== 0 || hy > 0) {
        hy += hv * dt
        hv -= 13 * dt
        if (hy <= 0) {
          hy = 0
          hv = 0
        }
      }
      flick[k] = angle
      flick[k + 1] = vel
      flick[k + 2] = hy
      flick[k + 3] = hv

      if (i === BAR_COIN) {
        // sits on the slanted top of the tallest bar, follows the bars group
        const tall = BARS.heights[2]
        barTop.set(BARS.w, tall - BARS.slant / 2 + 0.07, 0).applyEuler(b.rotation)
        const intro = 4.5 * settle(t - 0.3)
        o.position.set(b.position.x + barTop.x, b.position.y + barTop.y + hy + intro, b.position.z + barTop.z)
        barQ.setFromEuler(e.set(0, b.rotation.y, BAR_TILT))
        o.quaternion.copy(barQ)
        o.scale.setScalar(0.42)
      } else {
        const c = COINS[i]
        const intro = 5 * settle(t - c.delay)
        const ph = i * 1.7
        const amp = c.air ? 0.14 : i < 4 ? 0.05 : 0.07
        const phase = i < 4 ? 0 : ph
        const base = c.pw ?? c.p
        o.position.set(
          THREE.MathUtils.lerp(c.p[0], base[0], wide) + c.drift * sp,
          THREE.MathUtils.lerp(c.p[1], base[1], wide) + Math.sin(t * 0.8 + phase) * amp * floatOn + c.rise * sp + hy + intro,
          THREE.MathUtils.lerp(c.p[2], base[2], wide) + sp * 0.3,
        )
        const tumble = c.air ? t * 0.45 * floatOn : 0
        e.set(
          c.r[0] + tumble + sp * (0.6 + i * 0.1),
          c.r[1] + tumble * 0.6,
          c.r[2] + Math.sin(t * 0.6 + ph) * 0.03 * floatOn + sp * 0.4,
        )
        o.quaternion.setFromEuler(e)
        o.scale.setScalar(c.s)
      }
      q.setFromAxisAngle(axis, angle)
      o.quaternion.multiply(q)
      o.updateMatrix()
      mesh.setMatrixAt(i, o.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  })

  return (
    <>
      <group ref={layout}>
        <group ref={lean}>
          <mesh ref={receipt} geometry={receiptGeo} material={paperMat} scale={1.16} />
          <group ref={bars}>
            {BARS.heights.map((h, i) => (
              <mesh key={h} geometry={barGeos[i]} material={barMat} position={[(i - 1) * (BARS.w + 0.1), 0, 0]} />
            ))}
          </group>
          <instancedMesh
            ref={coins}
            args={[coinGeo, coinMat, COUNT]}
            frustumCulled={false}
            onClick={onCoinClick}
            onPointerOver={() => {
              if (!reduced) document.documentElement.style.cursor = "pointer"
            }}
            onPointerOut={() => {
              document.documentElement.style.cursor = ""
            }}
          />
        </group>
      </group>
      <ContactShadows
        ref={shadow}
        scale={[Math.max(8, viewport.width * 1.1), 7]}
        far={3.2}
        blur={2.6}
        resolution={quality === "low" ? 256 : 512}
        opacity={palette.shadowOpacity}
        color={palette.shadow}
        frames={reduced ? 2 : Infinity}
      />
    </>
  )
}

export default function HeroScene({ className }: { className?: string }) {
  useEffect(
    () => () => {
      document.documentElement.style.cursor = ""
    },
    [],
  )
  return (
    <SceneShell
      className={className}
      fallback={<HeroFallback />}
      camera={{ position: [0, 0.5, 12], fov: 30 }}
      interactive
    >
      {(scene) => <HeroContent scene={scene} />}
    </SceneShell>
  )
}
