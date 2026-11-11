import type { CSSProperties } from "react"

/**
 * Shared animation props for brand elements.
 * - default: animates once when it scrolls into view
 * - `inView`: controlled by a parent scene (true = final state, false = before)
 * - `still`: never animates, always in the final state
 */
export type AnimProps = {
  /** ms before this element starts */
  delay?: number
  inView?: boolean
  still?: boolean
}

export function animAttrs({ delay = 0, inView, still }: AnimProps, style?: CSSProperties) {
  const state: Record<string, string> = still
    ? { "data-inview": "still" }
    : inView === undefined
      ? { "data-animate": "" }
      : { "data-inview": inView ? "true" : "false" }
  return { ...state, style: { "--d": `${delay}ms`, ...style } as CSSProperties }
}
