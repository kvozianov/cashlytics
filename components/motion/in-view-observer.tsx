"use client"

import { useEffect } from "react"

const SELECTOR = "[data-animate]:not([data-inview])"

/**
 * One observer for the whole app. Anything rendered with `data-animate` gets
 * `data-inview="true"` the first time it enters the viewport, which flips its
 * CSS from the "before" state to the final one. Mounted once in the root layout.
 */
export function InViewObserver() {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return
    document.documentElement.setAttribute("data-io", "")

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute("data-inview", "true")
          io.unobserve(entry.target)
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0 },
    )

    const scan = (root: ParentNode) => {
      if (root instanceof Element && root.matches(SELECTOR)) io.observe(root)
      root.querySelectorAll(SELECTOR).forEach((el) => io.observe(el))
    }
    scan(document)

    const mo = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) scan(node)
        })
      }
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      document.documentElement.removeAttribute("data-io")
      io.disconnect()
      mo.disconnect()
    }
  }, [])

  return null
}
