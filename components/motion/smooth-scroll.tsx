"use client"

import { useEffect } from "react"
import Lenis from "lenis"

/**
 * Smooth wheel scrolling for marketing pages. Touch stays native, anchors
 * still work, and it is skipped entirely for reduced motion. Render it once
 * per page; it renders nothing.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.11,
      anchors: { offset: -72 },
      allowNestedScroll: true,
      prevent: (node) => node.closest("[data-lenis-prevent], [role='dialog'], [data-radix-popper-content-wrapper]") !== null,
    })

    return () => lenis.destroy()
  }, [])

  return null
}
