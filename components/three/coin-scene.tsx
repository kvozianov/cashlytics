"use client"

import { useEffect, useRef } from "react"
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber"
import { ContactShadows } from "@react-three/drei"
import * as THREE from "three"
import { CoinFallback } from "./fallbacks"
import { SceneShell, type SceneState } from "./lib/scene-shell"
import { damp } from "./lib/core"
import { createCoinGeometry, createCoinMaterial } from "./lib/geometry"
import { useDisposable } from "./lib/hooks"
import { fontsReady, heightToNormal, paintCoinLegend, resolveFonts, toTexture } from "./lib/textures"

const FIELD_R = 0.79
const FIELD_Y = 0.085

// Maps a +Z-facing disc onto the coin's -Y face so the legend reads upright
// when the coin is turned around its vertical axis.
const BACK_FACE = new THREE.Matrix4().set(-1, 0, 0, 0, 0, 0, -1, -FIELD_Y - 0.0015, 0, -1, 0, 0, 0, 0, 0, 1)

function CoinContent({ scene }: { scene: SceneState }) {
  const { reduced, quality, palette } = scene
  const gl = useThree((s) => s.gl)
  const invalidate = useThree((s) => s.invalidate)

  const layout = useRef<THREE.Group>(null)
  const spin = useRef<THREE.Group>(null)
  const shadow = useRef<THREE.Group>(null)
  const viewport = useThree((s) => s.viewport)

  const coinGeo = useDisposable(
    () => createCoinGeometry({ segments: quality === "low" ? 72 : 128, emboss: "top", profileSteps: 6 }),
    [quality],
  )
  const discGeo = useDisposable(() => new THREE.CircleGeometry(FIELD_R, 96).applyMatrix4(BACK_FACE), [])
  const coinMat = useDisposable(() => createCoinMaterial(), [])
  const discMat = useDisposable(
    () => new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0, normalScale: new THREE.Vector2(1, 1) }),
    [],
  )

  useEffect(() => {
    coinMat.color.set(palette.lime)
    discMat.color.set(palette.lime)
    invalidate()
  }, [palette, coinMat, discMat, invalidate])

  useEffect(() => {
    const fonts = resolveFonts()
    const made: THREE.Texture[] = []
    let cancelled = false
    fontsReady(fonts).then(() => {
      if (cancelled) return
      const size = quality === "low" ? 512 : 1024
      const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy())
      const normal = toTexture(heightToNormal(paintCoinLegend(fonts, size, "height"), size / 512), {
        srgb: false,
        anisotropy: aniso,
      })
      const color = toTexture(paintCoinLegend(fonts, size, "color"), { anisotropy: aniso })
      discMat.normalMap = normal
      discMat.map = color
      discMat.needsUpdate = true
      made.push(normal, color)
      invalidate()
    })
    return () => {
      cancelled = true
      made.forEach((t) => t.dispose())
    }
  }, [gl, quality, discMat, invalidate])

  const motion = useRef({ turn: 0.35, flip: 0, flipVel: 0, flipTarget: 0, px: 0, py: 0, hover: false })
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => window.removeEventListener("pointermove", onMove)
  }, [])

  const flip = () => {
    if (reduced) return
    motion.current.flipTarget += Math.PI
  }

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30)
    const m = motion.current
    const vw = state.viewport.width
    const vh = state.viewport.height
    const scale = Math.min(vw, vh) * 0.34
    const g = layout.current!
    g.scale.setScalar(scale)
    shadow.current!.position.set(0, -1.3 * scale, 0)

    if (reduced) {
      spin.current!.rotation.set(-0.08, 0.38, 0)
      g.position.set(0, 0.06 * scale, 0)
      return
    }
    m.turn += dt * 0.32
    m.flipVel += ((m.flipTarget - m.flip) * 60 - m.flipVel * 7.5) * dt
    m.flip += m.flipVel * dt
    m.px = damp(m.px, pointer.current.x, 3, dt)
    m.py = damp(m.py, pointer.current.y, 3, dt)
    const t = state.clock.elapsedTime
    spin.current!.rotation.set(
      m.py * 0.28 + Math.sin(t * 0.7) * 0.04,
      m.turn + m.flip + m.px * 0.35,
      Math.sin(t * 0.5) * 0.03,
    )
    g.position.set(m.px * 0.12 * scale, (0.06 + Math.sin(t * 0.9) * 0.04) * scale - m.py * 0.08 * scale, 0)
  })

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (!reduced) document.documentElement.style.cursor = "pointer"
    if (e.nativeEvent.pointerType === "mouse" && !motion.current.hover) flip()
    motion.current.hover = true
  }
  const onOut = () => {
    motion.current.hover = false
    document.documentElement.style.cursor = ""
  }

  return (
    <>
      <group ref={layout}>
        <group ref={spin}>
          <group rotation-x={Math.PI / 2} onPointerOver={onOver} onPointerOut={onOut} onClick={flip}>
            <mesh geometry={coinGeo} material={coinMat} />
            <mesh geometry={discGeo} material={discMat} />
          </group>
        </group>
      </group>
      <ContactShadows
        ref={shadow}
        scale={[Math.min(viewport.width, viewport.height) * 2, Math.min(viewport.width, viewport.height) * 1.4]}
        far={2.4}
        blur={2.2}
        resolution={quality === "low" ? 256 : 384}
        opacity={palette.shadowOpacity * 0.9}
        color={palette.shadow}
        frames={reduced ? 2 : Infinity}
      />
    </>
  )
}

export default function CoinScene({ className }: { className?: string }) {
  useEffect(
    () => () => {
      document.documentElement.style.cursor = ""
    },
    [],
  )
  return (
    <SceneShell
      className={className}
      fallback={<CoinFallback />}
      camera={{ position: [0, 0.3, 6], fov: 30 }}
      interactive
    >
      {(scene) => <CoinContent scene={scene} />}
    </SceneShell>
  )
}
