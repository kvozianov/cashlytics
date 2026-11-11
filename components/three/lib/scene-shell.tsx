"use client"

import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Environment, Lightformer } from "@react-three/drei"
import * as THREE from "three"
import { cn } from "@/lib/utils"
import { getPalette, guessQuality, refineQuality, type Palette, type Quality } from "./core"
import { hasWebGL, useCanvasActive, useIsDark, usePrefersReducedMotion } from "./hooks"

// Passed into the canvas as props rather than context, which keeps it intact
// across the separate R3F reconciler (and its fast-refresh passes).
export type SceneState = {
  reduced: boolean
  active: boolean
  quality: Quality
  palette: Palette
}

class GLBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== "production") console.warn("3D scene disabled:", error)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function FirstFrame({ onReady }: { onReady: () => void }) {
  const done = useRef(false)
  useFrame(() => {
    if (done.current) return
    done.current = true
    onReady()
  })
  return null
}

function EventGate({ enabled }: { enabled: boolean }) {
  const setEvents = useThree((s) => s.setEvents)
  useEffect(() => setEvents({ enabled }), [enabled, setEvents])
  return null
}

function Studio({ palette }: { palette: Palette }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => invalidate(), [palette, invalidate])
  return (
    <>
      <hemisphereLight args={[palette.hemiSky, palette.hemiGround, palette.hemi]} />
      <directionalLight position={[-4, 6, 6]} intensity={palette.key} color="#FFF3DF" />
      <directionalLight position={[6, 1.5, 3]} intensity={palette.fill} color="#E9EEFF" />
      <directionalLight position={[2, 4, -7]} intensity={palette.rim} color="#FFFFFF" />
      <Environment resolution={64} environmentIntensity={palette.env}>
        <color attach="background" args={["#2B2721"]} />
        <Lightformer form="rect" intensity={2.2} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[12, 12, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[4, 10, 1]} />
        <Lightformer form="rect" intensity={0.7} position={[6, 0, 2]} rotation-y={-Math.PI / 2} scale={[3, 8, 1]} />
        <Lightformer form="rect" intensity={1.1} position={[0, 1, 8]} scale={[8, 3, 1]} color="#FFF6E8" />
      </Environment>
    </>
  )
}

type ShellProps = {
  className?: string
  fallback: ReactNode
  camera: { position: [number, number, number]; fov: number }
  interactive?: boolean
  children: (scene: SceneState) => ReactNode
}

export function SceneShell({ className, fallback, camera, interactive = false, children }: ShellProps) {
  const wrapper = useRef<HTMLDivElement>(null)
  // the scenes are client-only (next/dynamic with ssr: false), so this runs in the browser
  const [supported] = useState(() => typeof window !== "undefined" && hasWebGL())
  const [ready, setReady] = useState(false)
  const [baseQuality] = useState<Quality>(guessQuality)
  const [quality, setQuality] = useState<Quality>(baseQuality)
  const reduced = usePrefersReducedMotion()
  const dark = useIsDark()
  const active = useCanvasActive(wrapper)
  const palette = useMemo(() => getPalette(dark), [dark])

  const [faded, setFaded] = useState(false)

  useEffect(() => {
    if (!ready) return
    const id = window.setTimeout(() => setFaded(true), 600)
    return () => window.clearTimeout(id)
  }, [ready])

  const state = useMemo<SceneState>(() => ({ reduced, active, quality, palette }), [reduced, active, quality, palette])
  const frameloop = reduced ? "demand" : active ? "always" : "never"

  return (
    <div ref={wrapper} className={cn("pointer-events-none relative h-full w-full", className)}>
      {(!faded || !supported) && (
        <div
          className="absolute inset-0 transition-opacity duration-500 ease-out"
          style={{ opacity: ready && supported ? 0 : 1 }}
        >
          {fallback}
        </div>
      )}
      {supported && (
        <GLBoundary fallback={fallback}>
          <div className="absolute inset-0 transition-opacity duration-500 ease-out" style={{ opacity: ready ? 1 : 0 }}>
              <Canvas
                frameloop={frameloop}
                dpr={baseQuality === "low" ? [1, 1.5] : [1, 1.75]}
                gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
                camera={{ position: camera.position, fov: camera.fov, near: 0.1, far: 60 }}
                eventSource={interactive ? (document.documentElement as HTMLElement) : undefined}
                eventPrefix={interactive ? "client" : undefined}
                onCreated={({ gl }) => {
                  gl.setClearColor(0x000000, 0)
                  gl.toneMapping = THREE.NeutralToneMapping
                  gl.toneMappingExposure = 1
                  setQuality(refineQuality(baseQuality, gl))
                }}
                style={{ pointerEvents: "none" }}
                aria-hidden
              >
                <EventGate enabled={interactive && active && !reduced} />
                <FirstFrame onReady={() => setReady(true)} />
                <Studio palette={palette} />
                {children(state)}
              </Canvas>
          </div>
        </GLBoundary>
      )}
    </div>
  )
}
