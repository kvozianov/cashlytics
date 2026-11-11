"use client"

import { useCallback, useSyncExternalStore } from "react"

/**
 * Hydration-safe media query. Renders `serverValue` on the server and during
 * hydration, then follows the real query.
 */
export function useMediaQuery(query: string, serverValue = false) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => serverValue,
  )
}

/**
 * `true` when the visitor asked for reduced motion. Server render assumes
 * motion is fine; CSS already shows the final state for reduced motion, so the
 * first paint is correct either way.
 */
export function useReducedMotionSafe() {
  return useMediaQuery("(prefers-reduced-motion: reduce)", false)
}

/** `true` on devices with a precise pointer that can hover (mouse, trackpad). */
export function useFinePointer() {
  return useMediaQuery("(hover: hover) and (pointer: fine)", false)
}
