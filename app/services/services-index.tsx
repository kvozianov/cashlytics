"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

type Item = { id: string; title: string }

/** Sticky mono contents list that follows the chapter being read. */
export function ServicesIndex({ items }: { items: Item[] }) {
  const [active, setActive] = useState(items[0]?.id)

  useEffect(() => {
    const visible = new Map<string, number>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0)
        // the first chapter (in page order) that is meaningfully on screen wins
        const current = items.find((item) => (visible.get(item.id) ?? 0) > 0)
        if (current) setActive(current.id)
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.01] },
    )
    items.forEach((item) => {
      const el = document.getElementById(item.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [items])

  return (
    <nav aria-label="Services on this page" className="font-mono text-[11px] font-medium tracking-[0.14em] uppercase">
      <p className="border-b-2 border-foreground pb-2 text-muted-foreground">Index</p>
      <ol className="max-lg:-mx-5 max-lg:flex max-lg:overflow-x-auto max-lg:px-5 sm:max-lg:-mx-8 sm:max-lg:px-8" data-lenis-prevent>
        {items.map((item, i) => {
          const on = item.id === active
          return (
            <li key={item.id} className="shrink-0 border-border max-lg:border-r lg:border-b">
              <a
                href={`#${item.id}`}
                aria-current={on ? "true" : undefined}
                className={cn(
                  "group relative flex items-baseline gap-3 py-3 pr-4 transition-colors max-lg:pl-4 max-lg:first:pl-0",
                  on ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="whitespace-nowrap lg:whitespace-normal">{item.title}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute bottom-0 left-0 h-[3px] w-full origin-left bg-lime transition-transform duration-300 lg:-left-4 lg:top-2 lg:bottom-2 lg:h-auto lg:w-[3px] lg:origin-top",
                    on ? "scale-100" : "max-lg:scale-x-0 lg:scale-y-0",
                  )}
                />
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
