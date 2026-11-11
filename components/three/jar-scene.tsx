"use client"

import { useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { ContactShadows } from "@react-three/drei"
import type { MotionValue } from "motion/react"
import * as THREE from "three"
import { JarFallback } from "./fallbacks"
import { SceneShell, type SceneState } from "./lib/scene-shell"
import { clamp, damp, seededRandom, smoothstep } from "./lib/core"
import { createCoinGeometry, createCoinMaterial, roundCorners } from "./lib/geometry"
import { useDisposable } from "./lib/hooks"
import { createGlassMaterial } from "./lib/receipt-material"
import { fontsReady, paintCork, paintLabel, paintNeededMark, paintStamp, resolveFonts, toTexture } from "./lib/textures"

const N = 52
const COIN_R = 0.3
const THICK = 1.35 // jar coins are a little chunkier than the hero ones
const COIN_T = 0.3 * COIN_R * THICK
const FLOOR = 0.09
const INNER_R = 0.97
const MOUTH_Y = 2.46
const NEEDED_AT = 0.85
const LAND = 0.72 // share of a coin's drop spent falling; the rest is the bounce

type Rest = {
  pos: THREE.Vector3
  quat: THREE.Quaternion
  start: THREE.Vector3
  startQuat: THREE.Quaternion
  top: number
}

// Deterministic heap: each coin tries a few spots and keeps the lowest one it
// can rest on, tilting when it lands on the edge of another coin.
function packCoins() {
  const rnd = seededRandom(2026)
  const rests: Rest[] = []
  const rMax = INNER_R - COIN_R - 0.04
  const up = new THREE.Vector3(0, 1, 0)
  for (let i = 0; i < N; i++) {
    let best: { x: number; z: number; y: number; tiltDir: number; tilt: number } | null = null
    for (let k = 0; k < 6; k++) {
      const a = rnd() * Math.PI * 2
      const rr = Math.sqrt(rnd()) * rMax
      const x = Math.cos(a) * rr
      const z = Math.sin(a) * rr
      let y = FLOOR + COIN_T / 2
      let tiltDir = rnd() * Math.PI * 2
      let tilt = rnd() * 0.06
      for (const r of rests) {
        const d = Math.hypot(r.pos.x - x, r.pos.z - z)
        if (d > COIN_R * 1.85) continue
        const h = r.pos.y + COIN_T * (0.98 - 0.3 * (d / (COIN_R * 2)))
        if (h > y) {
          y = h
          tilt = d > COIN_R * 0.5 ? 0.12 + rnd() * 0.26 : rnd() * 0.08
          tiltDir = Math.atan2(z - r.pos.z, x - r.pos.x)
        }
      }
      if (!best || y < best.y) best = { x, z, y, tiltDir, tilt }
    }
    const b = best!
    const axis = new THREE.Vector3(-Math.sin(b.tiltDir), 0, Math.cos(b.tiltDir))
    const quat = new THREE.Quaternion()
      .setFromAxisAngle(axis, b.tilt)
      .multiply(new THREE.Quaternion().setFromAxisAngle(up, rnd() * Math.PI * 2))
    const startQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 3, rnd() * 3, rnd() * 3))
    const pos = new THREE.Vector3(b.x, b.y, b.z)
    rests.push({
      pos,
      quat,
      start: new THREE.Vector3(b.x * 0.25, MOUTH_Y + 0.9 + rnd() * 0.3, b.z * 0.25),
      startQuat,
      top: b.y + Math.sin(b.tilt) * COIN_R + COIN_T / 2,
    })
  }
  const neededIdx = Math.ceil(N * NEEDED_AT) - 1
  let level = 0
  for (let i = 0; i <= neededIdx; i++) level = Math.max(level, rests[i].top)
  let full = 0
  for (const r of rests) full = Math.max(full, r.top)
  return { rests, neededLevel: level, fullLevel: full }
}

function jarProfile() {
  return roundCorners(
    [
      [0, 0.02],
      [0.86, 0],
      [1.0, 0.1],
      [1.02, 0.4],
      [1.02, 1.85],
      [0.95, 2.06],
      [0.8, 2.2],
      [0.8, 2.32],
      [0.87, 2.36],
      [0.87, 2.44],
      [0.78, MOUTH_Y],
    ],
    0.07,
    5,
  )
}

function corkProfile() {
  return roundCorners(
    [
      [0, 0],
      [0.7, 0],
      [0.74, 0.17],
      [0.86, 0.19],
      [0.88, 0.44],
      [0, 0.46],
    ],
    0.035,
    3,
  )
}

const LABEL_THETA = 1.36
const LABEL_H = 0.8
const LABEL_Y = 0.8
const MARK_THETA0 = -0.2
const MARK_THETA = 1.0
const STAMP_THETA = 0.36

function JarContent({ progress, scene }: { progress: MotionValue<number>; scene: SceneState }) {
  const { reduced, quality, palette } = scene
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const invalidate = useThree((s) => s.invalidate)

  useLayoutEffect(() => {
    camera.lookAt(0, 0.05, 0)
  }, [camera])

  useEffect(() => progress.on("change", () => invalidate()), [progress, invalidate])

  const { rests, neededLevel } = useMemo(() => packCoins(), [])

  const layout = useRef<THREE.Group>(null)
  const jar = useRef<THREE.Group>(null)
  const coins = useRef<THREE.InstancedMesh>(null)
  const lid = useRef<THREE.Mesh>(null)
  const stamp = useRef<THREE.Mesh>(null)
  const shadow = useRef<THREE.Group>(null)
  const viewport = useThree((s) => s.viewport)

  const coinGeo = useDisposable(
    () =>
      createCoinGeometry({
        segments: quality === "low" ? 24 : 36,
        emboss: quality === "low" ? "none" : "both",
        profileSteps: 2,
      }),
    [quality],
  )
  const coinMat = useDisposable(() => createCoinMaterial(), [])
  const jarGeo = useDisposable(() => new THREE.LatheGeometry(jarProfile(), 72), [])
  const glassBack = useDisposable(() => createGlassMaterial(THREE.BackSide), [])
  const glassFront = useDisposable(() => createGlassMaterial(THREE.FrontSide), [])
  const corkGeo = useDisposable(() => new THREE.LatheGeometry(corkProfile(), 48), [])
  const corkMat = useDisposable(() => new THREE.MeshStandardMaterial({ roughness: 0.95, metalness: 0 }), [])
  const labelGeo = useDisposable(
    () => new THREE.CylinderGeometry(1.034, 1.034, LABEL_H, 48, 1, true, -LABEL_THETA / 2, LABEL_THETA),
    [],
  )
  const labelMat = useDisposable(
    () => new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, color: "#ffffff" }),
    [],
  )
  const markGeo = useDisposable(
    () => new THREE.CylinderGeometry(1.03, 1.03, 0.24, 24, 1, true, MARK_THETA0, MARK_THETA),
    [],
  )
  const markMat = useDisposable(
    () => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }),
    [],
  )
  const stampGeo = useDisposable(() => new THREE.PlaneGeometry(0.4, 0.4), [])
  const stampMat = useDisposable(
    () => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }),
    [],
  )

  // canvas-painted label, cork, stamp and the "needed" mark
  useEffect(() => {
    const fonts = resolveFonts()
    const made: THREE.Texture[] = []
    let cancelled = false
    const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy())
    const cork = toTexture(paintCork(256))
    cork.wrapS = cork.wrapT = THREE.RepeatWrapping
    corkMat.map = cork
    corkMat.needsUpdate = true
    made.push(cork)
    fontsReady(fonts).then(() => {
      if (cancelled) return
      const label = toTexture(paintLabel(fonts, 1024, Math.round(1024 / ((1.034 * LABEL_THETA) / LABEL_H))), {
        anisotropy: aniso,
      })
      const st = toTexture(paintStamp(fonts, 256))
      labelMat.map = label
      labelMat.needsUpdate = true
      stampMat.map = st
      stampMat.needsUpdate = true
      made.push(label, st)
      invalidate()
    })
    return () => {
      cancelled = true
      made.forEach((t) => t.dispose())
    }
  }, [gl, corkMat, labelMat, stampMat, invalidate])

  useEffect(() => {
    const fonts = resolveFonts()
    let tex: THREE.Texture | null = null
    let cancelled = false
    fontsReady(fonts).then(() => {
      if (cancelled) return
      const w = 512
      const h = Math.round(w / ((1.03 * MARK_THETA) / 0.24))
      tex = toTexture(paintNeededMark(fonts, w, h, palette.dark ? "#EFEBE1" : "#14130F"))
      markMat.map = tex
      markMat.opacity = 1
      markMat.needsUpdate = true
      invalidate()
    })
    return () => {
      cancelled = true
      tex?.dispose()
    }
  }, [palette.dark, markMat, invalidate])

  useEffect(() => {
    const dark = palette.dark
    for (const m of [glassBack, glassFront]) {
      m.uniforms.uTint.value.set(dark ? "#F4F1EA" : "#DCEBE4")
      m.uniforms.uEdge.value.set(dark ? "#F4F1EA" : "#4A5A52")
      m.uniforms.uAlpha.value = dark ? 0.05 : 0.07
      m.uniforms.uEdgeAlpha.value = dark ? 0.7 : 0.58
      m.uniforms.uHiAlpha.value = dark ? 0.85 : 0.8
    }
    glassBack.uniforms.uEdgeAlpha.value *= 0.5
    corkMat.color.set(palette.cork)
    const mesh = coins.current
    if (mesh) {
      const tones = [palette.lime, palette.green, palette.ink, palette.lime, palette.green]
      const rnd = seededRandom(77)
      const c = new THREE.Color()
      for (let i = 0; i < N; i++) mesh.setColorAt(i, c.set(tones[Math.floor(rnd() * tones.length)]))
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
    invalidate()
  }, [palette, glassBack, glassFront, corkMat, invalidate])

  const sim = useMemo(
    () => ({
      s: new Float32Array(N),
      wob: new Float32Array(4), // angle x, vel x, angle z, vel z
      lid: 0,
      stamp: 0,
      t0: -1,
      rnd: seededRandom(3),
    }),
    [],
  )
  const temp = useMemo(() => ({ o: new THREE.Object3D(), v: new THREE.Vector3() }), [])

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30)
    if (sim.t0 < 0) sim.t0 = state.clock.elapsedTime
    const t = state.clock.elapsedTime - sim.t0
    const p = clamp(progress.get(), 0, 1)

    const vw = state.viewport.width
    const vh = state.viewport.height
    const scale = Math.min((vh * 0.8) / 3.3, (vw * 0.88) / 3.55)
    const g = layout.current!
    g.scale.setScalar(scale)
    g.rotation.y = reduced ? -0.12 : -0.12 + Math.sin(t * 0.35) * 0.1

    const { s, wob } = sim
    let landed = 0
    for (let i = 0; i < N; i++) {
      const want = p >= ((i + 0.5) / N) * 0.97
      const before = s[i]
      if (reduced) s[i] = want ? 1 : 0
      else if (want) {
        if (i === 0 || s[i - 1] > 0.16) s[i] = Math.min(1, s[i] + dt / 0.7)
      } else if (i === N - 1 || s[i + 1] < 0.4) {
        s[i] = Math.max(0, s[i] - dt / 0.38)
      }
      if (!reduced && before < LAND && s[i] >= LAND) {
        const kick = 0.05 * (1 - (i / N) * 0.5)
        wob[1] += (sim.rnd() - 0.5) * kick * 2
        wob[3] += (sim.rnd() > 0.5 ? 1 : -1) * kick
      }
      if (s[i] >= LAND) landed++
    }

    for (let a = 0; a < 4; a += 2) {
      if (reduced) {
        wob[a] = 0
        wob[a + 1] = 0
        continue
      }
      wob[a + 1] += (-wob[a] * 110 - wob[a + 1] * 7) * dt
      wob[a] += wob[a + 1] * dt
    }
    const j = jar.current!
    j.rotation.set(wob[0], 0, wob[2])

    const mesh = coins.current!
    const { o } = temp
    for (let i = 0; i < N; i++) {
      const r = rests[i]
      const si = s[i]
      if (si <= 0) {
        o.position.set(0, -50, 0)
        o.scale.setScalar(0)
      } else {
        if (si < LAND) {
          const k = si / LAND
          const fall = k * k
          o.position.lerpVectors(r.start, r.pos, fall)
          o.position.x = THREE.MathUtils.lerp(r.start.x, r.pos.x, smoothstep(0, 1, k))
          o.position.z = THREE.MathUtils.lerp(r.start.z, r.pos.z, smoothstep(0, 1, k))
          o.quaternion.slerpQuaternions(r.startQuat, r.quat, smoothstep(0.15, 1, k))
        } else {
          const v = (si - LAND) / (1 - LAND)
          o.position.copy(r.pos)
          o.position.y += Math.sin(Math.PI * Math.min(1, v * 1.6)) * 0.09 * (1 - v)
          o.quaternion.copy(r.quat)
        }
        const k = COIN_R * Math.min(1, si / 0.06)
        o.scale.set(k, k * THICK, k)
      }
      o.updateMatrix()
      mesh.setMatrixAt(i, o.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true

    // lid goes on once every coin is in; the stamp lands when the pile passes the line
    const lidTarget = landed === N ? 1 : 0
    sim.lid = reduced ? lidTarget : damp(sim.lid, lidTarget, lidTarget ? 3.2 : 5, dt)
    const l = lid.current!
    const lt = smoothstep(0, 1, sim.lid)
    g.position.set(-0.36 * (1 - lt) * scale, -1.28 * scale, 0)
    shadow.current!.position.set(0, g.position.y - 0.005 * scale, 0)
    l.position.set(
      THREE.MathUtils.lerp(1.42, 0, lt),
      THREE.MathUtils.lerp(0, 2.29, lt) + Math.sin(Math.PI * lt) * 0.9,
      THREE.MathUtils.lerp(0.05, 0, lt),
    )
    l.rotation.set(Math.sin(Math.PI * lt) * 0.5, 0.4 * (1 - lt), Math.sin(Math.PI * lt) * -0.3)

    const stampTarget = landed >= Math.ceil(N * NEEDED_AT) ? 1 : 0
    sim.stamp = reduced
      ? stampTarget
      : stampTarget
        ? Math.min(1, sim.stamp + dt / 0.16)
        : Math.max(0, sim.stamp - dt / 0.25)
    const st = stamp.current!
    const thunk = stampTarget ? 1 + (1 - sim.stamp) * 0.7 : 1
    st.scale.setScalar(thunk)
    stampMat.opacity = sim.stamp * 0.92
    st.visible = sim.stamp > 0.001
  })

  const stampPos: [number, number, number] = [Math.sin(STAMP_THETA) * 1.06, LABEL_Y - 0.2, Math.cos(STAMP_THETA) * 1.06]

  return (
    <>
      <group ref={layout}>
        <group ref={jar}>
          <instancedMesh ref={coins} args={[coinGeo, coinMat, N]} frustumCulled={false} />
          <mesh geometry={jarGeo} material={glassBack} renderOrder={1} />
          <mesh geometry={labelGeo} material={labelMat} position-y={LABEL_Y} />
          <mesh
            ref={stamp}
            geometry={stampGeo}
            material={stampMat}
            position={stampPos}
            rotation={[0, STAMP_THETA, -0.1]}
            renderOrder={4}
          />
          <mesh geometry={jarGeo} material={glassFront} renderOrder={2} />
          <mesh geometry={markGeo} material={markMat} position-y={neededLevel} renderOrder={3} />
        </group>
        <mesh ref={lid} geometry={corkGeo} material={corkMat} />
      </group>
      <ContactShadows
        ref={shadow}
        scale={[Math.max(5, viewport.width * 1.05), 5]}
        far={2.6}
        blur={2.4}
        resolution={quality === "low" ? 256 : 512}
        opacity={palette.shadowOpacity}
        color={palette.shadow}
        frames={reduced ? 2 : Infinity}
      />
    </>
  )
}

export default function JarScene({ progress, className }: { progress: MotionValue<number>; className?: string }) {
  return (
    <SceneShell className={className} fallback={<JarFallback />} camera={{ position: [0, 2.2, 9.5], fov: 28 }}>
      {(scene) => <JarContent progress={progress} scene={scene} />}
    </SceneShell>
  )
}
