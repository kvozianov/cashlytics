"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { motion, useMotionValueEvent, useScroll } from "motion/react"
import { Logo } from "./logo"
import { ThemeToggle } from "./theme-toggle"
import { useReducedMotionSafe } from "./motion/use-reduced-motion-safe"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Home", href: "/" },
  { name: "Services", href: "/services" },
  { name: "Pricing", href: "/pricing" },
  { name: "About", href: "/about" },
]

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Header() {
  const pathname = usePathname() ?? "/"
  const reduced = useReducedMotionSafe()
  // The menu remembers the path it was opened on, so it closes itself after navigation.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const menuOpen = openOn === pathname
  const setMenuOpen = (open: boolean) => setOpenOn(open ? pathname : null)

  // Slides away while reading down, comes back on the way up.
  const [tucked, setTucked] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const { scrollY } = useScroll()
  useMotionValueEvent(scrollY, "change", (y) => {
    const previous = scrollY.getPrevious() ?? 0
    if (y < 96) setTucked(false)
    else if (y > previous + 4) setTucked(true)
    else if (y < previous - 4) setTucked(false)
  })
  const hidden = tucked && !menuOpen && !focusWithin

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenOn(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [menuOpen])

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/92"
      initial={false}
      animate={{ y: hidden ? "-101%" : "0%" }}
      transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 40 }}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={() => setFocusWithin(false)}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12"
      >
        <Logo markClassName="h-7 w-7" />

        <ul className="hidden items-center gap-5 md:flex lg:gap-7">
          {navigation.map((item, i) => {
            const active = isActive(pathname, item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-baseline gap-1.5 py-2 font-mono text-[11px] font-medium tracking-[0.16em] uppercase transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span aria-hidden="true" className="hidden text-[9px] tabular-nums opacity-60 lg:inline">
                    0{i + 1}
                  </span>
                  {item.name}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-x-0 bottom-0.5 h-[3px] origin-left bg-lime transition-transform duration-200",
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                    )}
                  />
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link href="/demo" className="btn-ink h-9 px-4 text-[13px] whitespace-nowrap">
            Open live demo
            <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="-mr-2 inline-flex h-10 items-center gap-2 rounded-sm px-2 font-mono text-[11px] font-medium tracking-[0.16em] text-foreground uppercase"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "Close" : "Menu"}
            <span aria-hidden="true" className="relative block h-2.5 w-4">
              <span
                className={cn(
                  "absolute inset-x-0 top-0 h-[1.5px] bg-current transition-transform duration-200",
                  menuOpen && "translate-y-[4.5px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "absolute inset-x-0 bottom-0 h-[1.5px] bg-current transition-transform duration-200",
                  menuOpen && "-translate-y-[4.5px] -rotate-45",
                )}
              />
            </span>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-border bg-background md:hidden" data-lenis-prevent>
          <ul className="px-5 pt-2 pb-6 sm:px-8">
            {navigation.map((item, i) => {
              const active = isActive(pathname, item.href)
              return (
                <li key={item.href} className="border-b border-border">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-baseline justify-between py-3.5"
                  >
                    <span
                      className={cn(
                        "font-display text-[2rem] leading-none font-bold tracking-[-0.03em]",
                        active ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {item.name}
                    </span>
                    <span aria-hidden="true" className="font-mono text-xs text-muted-foreground tabular-nums">
                      0{i + 1}
                    </span>
                  </Link>
                </li>
              )
            })}
            <li className="pt-5">
              <Link href="/demo" onClick={() => setMenuOpen(false)} className="btn-ink h-12 w-full text-base">
                Open live demo
                <span aria-hidden="true">↗</span>
              </Link>
            </li>
          </ul>
        </div>
      )}
    </motion.header>
  )
}
