"use client"

import { useEffect, useMemo, useState, type RefObject } from "react"

export function useIsDark() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const el = document.documentElement
    const read = () => setDark(el.classList.contains("dark"))
    read()
    const mo = new MutationObserver(read)
    mo.observe(el, { attributes: true, attributeFilter: ["class"] })
    return () => mo.disconnect()
  }, [])
  return dark
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const read = () => setReduced(mq.matches)
    read()
    mq.addEventListener("change", read)
    return () => mq.removeEventListener("change", read)
  }, [])
  return reduced
}

// True while the element is near the viewport and the tab is visible.
export function useCanvasActive(ref: RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "120px 0px" })
    io.observe(el)
    const onVis = () => setVisible(document.visibilityState === "visible")
    onVis()
    document.addEventListener("visibilitychange", onVis)
    return () => {
      io.disconnect()
      document.removeEventListener("visibilitychange", onVis)
    }
  }, [ref])
  return inView && visible
}

let webglSupport: boolean | null = null

export function hasWebGL() {
  if (webglSupport !== null) return webglSupport
  try {
    const c = document.createElement("canvas")
    const ctx = c.getContext("webgl2") || c.getContext("webgl")
    webglSupport = !!ctx
    ;(ctx as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext()
  } catch {
    webglSupport = false
  }
  return webglSupport
}

export function useDisposable<T extends { dispose: () => void }>(factory: () => T, deps: unknown[]): T {
  // eslint-disable-next-line react-hooks/use-memo, react-hooks/exhaustive-deps
  const value = useMemo(factory, deps)
  useEffect(() => () => value.dispose(), [value])
  return value
}
