"use client"

import Link from "next/link"
import { useLayoutEffect, useRef, useState } from "react"
import { motion, useTransform, type MotionValue } from "motion/react"
import { Eyebrow, Marker, Stamp } from "@/components/brand"
import { RevealLines } from "@/components/motion/reveal-lines"
import { ScrollScene } from "@/components/motion/scroll-scene"
import { Tilt } from "@/components/motion/tilt"
import { useMediaQuery } from "@/components/motion/use-reduced-motion-safe"
import { cn } from "@/lib/utils"

const personas = [
  {
    id: "freelancer",
    name: "Maya Chen",
    short: "Maya",
    role: "Freelance product designer",
    segment: "Freelancer with irregular income",
    situation: "Four or five clients, invoices paid whenever they get round to it, and business and personal spending on the same card.",
    weakPoint: "Not enough put aside for tax, and one client paying more than 30 days late.",
    tilt: -1.4,
  },
  {
    id: "starter",
    name: "Daniel Okafor",
    short: "Daniel",
    role: "First full-time job",
    segment: "First stable income",
    situation: "A monthly salary, a small side gig that is taxable, rent, and a growing list of subscriptions.",
    weakPoint: "Subscriptions creeping up month by month, and no emergency buffer yet.",
    tilt: 1,
  },
  {
    id: "business",
    name: "Brew & Bloom",
    short: "Brew & Bloom",
    role: "Two-person coffee kiosk",
    segment: "Small business owner",
    situation: "Daily card-sales payouts, supplier bills, payroll, rent and an equipment loan.",
    weakPoint: "Supplier costs rising faster than sales, and a thin cash runway.",
    tilt: -0.6,
  },
]

const intro =
  "Open the demo as any of them. Each data set is built to reveal one real-life weak point, so you can watch Cashlytics find it."
const disclaimer =
  "All three are fictional. Their names, businesses and transactions are made up and generated in your browser."

function Heading() {
  return (
    <div className="max-w-md">
      <Eyebrow>Who it’s for</Eyebrow>
      <RevealLines
        id="personas-title"
        className="mt-5 font-display text-[clamp(2.25rem,4.4vw,4.25rem)] leading-[0.96] font-bold tracking-[-0.035em]"
        lines={["Three case files,", "three weak points."]}
      />
      <p data-animate="" className="reveal mt-6 leading-relaxed text-pretty text-muted-foreground">
        {intro}
      </p>
    </div>
  )
}

function CaseFile({ persona, index }: { persona: (typeof personas)[number]; index: number }) {
  return (
    <Tilt max={6} className="h-full">
      <Link
        href={`/demo?persona=${persona.id}`}
        className="group relative flex h-full flex-col rounded-[4px] focus-visible:outline-offset-4"
        style={{ rotate: `${persona.tilt}deg` }}
      >
        {/* folder tab */}
        <span className="relative z-10 ml-5 inline-flex w-fit items-center gap-2 rounded-t-[4px] border border-b-0 border-foreground/70 bg-secondary px-3 pt-1.5 pb-1 font-mono text-[10.5px] font-medium tracking-[0.16em] uppercase">
          Case {String(index + 1).padStart(2, "0")}
          <span className="hidden text-muted-foreground sm:inline">· {persona.segment}</span>
        </span>
        <span className="relative -mt-px flex flex-1 flex-col rounded-[4px] border border-foreground/70 bg-card p-6 shadow-[4px_4px_0_0_var(--foreground)] transition-shadow duration-200 group-hover:shadow-[7px_7px_0_0_var(--lime)] sm:p-7">
          <Stamp tone="signal" rotate={3} size="sm" className="absolute top-5 right-5" delay={200}>
            Fictional
          </Stamp>
          <span className="font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">Name</span>
          <span className="mt-1 pr-20 font-display text-[clamp(1.9rem,2.6vw,2.6rem)] leading-none font-bold tracking-[-0.035em]">
            {persona.name}
          </span>
          <span className="mt-1.5 text-sm text-muted-foreground">
            {persona.role}
            <span className="sm:hidden"> · {persona.segment}</span>
          </span>

          <span className="mt-6 border-t border-border pt-4 font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">
            Situation
          </span>
          <span className="mt-1.5 text-[0.95rem] leading-relaxed">{persona.situation}</span>

          <span className="mt-5 border-t border-border pt-4 font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">
            The weak point the demo surfaces
          </span>
          <span className="mt-1.5 text-[0.95rem] leading-relaxed font-medium">
            <Marker variant="underline" color="signal" delay={300}>
              {persona.weakPoint}
            </Marker>
          </span>

          <span className="mt-auto flex items-center justify-between pt-7 font-mono text-[12px] font-medium tracking-[0.12em] uppercase">
            Explore as {persona.short}
            <span
              aria-hidden="true"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-foreground text-base transition-colors duration-150 group-hover:bg-lime group-hover:text-ink"
            >
              ↗
            </span>
          </span>
        </span>
      </Link>
    </Tilt>
  )
}

export function Personas() {
  const lg = useMediaQuery("(min-width: 1024px)", false)
  if (lg) return <PersonasPinned />

  return (
    <section id="who-its-for" aria-labelledby="personas-title" className="overflow-x-clip border-t border-border py-20">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8">
        <Heading />
      </div>
      <ul className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pt-2 pb-8 sm:px-8" data-lenis-prevent>
        {personas.map((persona, i) => (
          <li key={persona.id} className="w-[min(86vw,400px)] shrink-0 snap-center">
            <CaseFile persona={persona} index={i} />
          </li>
        ))}
      </ul>
      <p className="mx-auto max-w-[1440px] px-5 font-mono text-[11px] leading-relaxed tracking-[0.06em] text-muted-foreground sm:px-8">
        {disclaimer}
      </p>
    </section>
  )
}

function PersonasPinned() {
  return (
    <ScrollScene id="who-its-for" aria-labelledby="personas-title" length="300vh" className="border-t border-border">
      {({ progress, reduced }) => <Track progress={progress} reduced={reduced} />}
    </ScrollScene>
  )
}

function Track({ progress, reduced }: { progress: MotionValue<number>; reduced: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [distance, setDistance] = useState(0)

  useLayoutEffect(() => {
    const el = trackRef.current
    if (!el) return
    const measure = () => setDistance(Math.max(0, el.scrollWidth - window.innerWidth))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener("resize", measure)
    return () => {
      ro.disconnect()
      window.removeEventListener("resize", measure)
    }
  }, [])

  const x = useTransform(progress, [0.04, 0.96], [0, -distance])

  return (
    <div className={cn("flex h-full items-center", reduced && "overflow-x-auto")}>
      <motion.div
        ref={trackRef}
        style={reduced ? undefined : { x }}
        className="flex h-[min(74svh,580px)] w-max items-stretch gap-[4vw] pr-[8vw] pl-12 will-change-transform"
      >
        <div className="flex w-[34vw] max-w-[520px] shrink-0 flex-col justify-center">
          <Heading />
        </div>
        {personas.map((persona, i) => (
          <div key={persona.id} className="w-[30vw] max-w-[460px] min-w-[380px] shrink-0 py-4">
            <CaseFile persona={persona} index={i} />
          </div>
        ))}
        <div className="flex w-[22vw] max-w-[340px] shrink-0 items-end pb-6">
          <p className="font-mono text-[11px] leading-relaxed tracking-[0.06em] text-muted-foreground">{disclaimer}</p>
        </div>
      </motion.div>
    </div>
  )
}
