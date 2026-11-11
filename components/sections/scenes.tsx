"use client"

import dynamic from "next/dynamic"
import type { MotionValue } from "motion/react"
import { CoinFallback, HeroFallback, JarFallback } from "@/components/three/fallbacks"
import { useMediaQuery, useReducedMotionSafe } from "@/components/motion/use-reduced-motion-safe"

// The canvases never render on the server: the flat fallbacks hold their place
// while three.js loads, for reduced motion, and (for the hero) on small screens.

const HeroScene = dynamic(() => import("@/components/three/hero-scene"), {
  ssr: false,
  loading: () => <HeroFallback />,
})
const JarScene = dynamic(() => import("@/components/three/jar-scene"), {
  ssr: false,
  loading: () => <JarFallback />,
})
const CoinScene = dynamic(() => import("@/components/three/coin-scene"), {
  ssr: false,
  loading: () => <CoinFallback />,
})

export function HeroObjects({ className }: { className?: string }) {
  const reduced = useReducedMotionSafe()
  const wide = useMediaQuery("(min-width: 768px)", false)
  if (reduced || !wide) return <HeroFallback className={className} />
  return <HeroScene className={className} />
}

export function TaxJar({ progress, className }: { progress: MotionValue<number>; className?: string }) {
  const reduced = useReducedMotionSafe()
  const mounted = useMediaQuery("all", false)
  if (reduced || !mounted) return <JarFallback className={className} />
  return <JarScene progress={progress} className={className} />
}

export function Coin({ className }: { className?: string }) {
  const reduced = useReducedMotionSafe()
  const mounted = useMediaQuery("all", false)
  if (reduced || !mounted) return <CoinFallback className={className} />
  return <CoinScene className={className} />
}
