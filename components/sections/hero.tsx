import Link from "next/link"
import type { CSSProperties } from "react"
import { Circled, MarginNote, Marker, Stamp } from "@/components/brand"
import { Magnetic } from "@/components/motion/magnetic"
import { RevealLines } from "@/components/motion/reveal-lines"
import { HeroObjects } from "./scenes"

const facts = ["No sign-up", "Fictional data", "Runs in your browser"]

export function Hero() {
  return (
    <section aria-labelledby="hero-title" data-boot-reveal="" className="relative isolate overflow-x-clip pt-20 sm:pt-24 lg:min-h-[100svh] lg:pt-24">
      {/* 3D desk objects: behind the type on large screens, below it on small ones */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[22vh] right-[-5vw] -z-10 hidden h-[min(82vh,860px)] w-[min(58vw,980px)] lg:block 2xl:top-[36vh] 2xl:h-[64vh] 2xl:right-[max(-5vw,calc((100vw-1440px)/2-8rem))] [&_canvas]:pointer-events-auto"
      >
        <HeroObjects />
      </div>

      <div className="relative z-10 mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div
          data-animate=""
          className="reveal flex items-center justify-between gap-4 border-b border-border pb-3 font-mono text-[10.5px] font-medium tracking-[0.18em] text-muted-foreground uppercase sm:text-[11px]"
        >
          <span>Concept prototype · 2026</span>
          <span className="hidden sm:inline">Manage · Plan · Learn</span>
          <span className="tabular-nums">Nº 001</span>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 sm:mt-8">
          <Link href="/about" aria-label="1st place, TeenMBA final 2026. Read the project story." className="rounded-[3px]">
            <Stamp rotate={-2.5} delay={250} size="md" subline="TeenMBA final 2026">
              1st place
            </Stamp>
          </Link>
          <Link
            href="/about"
            tabIndex={-1}
            aria-hidden="true"
            data-animate=""
            style={{ "--d": "300ms" } as CSSProperties}
            className="reveal font-mono text-[12px] font-medium tracking-[0.14em] text-muted-foreground uppercase hover:text-foreground"
          >
            De Montfort University
            <br />
            Kazakhstan · the story →
          </Link>
        </div>

        <div className="relative">
          <RevealLines
            as="h1"
            id="hero-title"
            delay={20}
            stagger={80}
            className="mt-6 font-display text-[clamp(3.05rem,8vw,9rem)] leading-[0.9] font-extrabold tracking-[-0.045em] text-foreground sm:mt-8"
            lines={[
              <>
                Manage your{" "}
                <Marker delay={420}>money.</Marker>
              </>,
              <>
                Plan your{" "}
                <Circled delay={520} weight={2.2}>
                  tax.
                </Circled>
                <MarginNote
                  arrow="left"
                  tone="signal"
                  rotate={-4}
                  delay={300}
                  className="ml-[0.6em] hidden align-[0.35em] text-[clamp(1.25rem,1.8vw,1.75rem)] font-semibold tracking-normal lg:inline-flex"
                >
                  <span aria-hidden="true">estimated as you earn it</span>
                </MarginNote>
              </>,
              <>
                Learn what to <Marker delay={620}>fix.</Marker>
              </>,
            ]}
          />

        </div>

        <div className="mt-1 flex justify-end pr-[8%] sm:pr-[30%] lg:hidden">
          <MarginNote arrow="up" tone="signal" rotate={-3} size="md" delay={300}>
            estimated as you earn it
          </MarginNote>
        </div>

        <div className="mt-9 grid gap-8 pb-16 sm:mt-10 lg:grid-cols-12 lg:gap-6 lg:pb-24">
          <p
            data-animate=""
            style={{ "--d": "350ms" } as CSSProperties}
            className="reveal max-w-[36rem] text-[1.0625rem] leading-relaxed text-pretty text-muted-foreground lg:col-span-5 lg:text-lg"
          >
            Cashlytics sorts your income and expenses, estimates the tax you owe as you earn it, and points to the weak
            spots in your money strategy, each with a two-minute lesson on what to do next. Designed for freelancers,
            people in their first job and small business owners.
          </p>

          <div
            data-animate=""
            style={{ "--d": "450ms" } as CSSProperties}
            className="reveal flex flex-col gap-6 lg:col-span-5 lg:col-start-1"
          >
            <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
              <Magnetic>
                <Link href="/demo" className="btn-ink h-14 px-7 text-base">
                  Try the live demo
                  <span aria-hidden="true" className="text-lg leading-none">
                    →
                  </span>
                </Link>
              </Magnetic>
              <Link
                href="/services"
                className="group inline-flex items-center gap-2 py-2 font-medium text-foreground underline decoration-1 underline-offset-[6px] hover:decoration-2"
              >
                See the services
              </Link>
            </div>
            <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              {facts.map((fact, i) => (
                <li key={fact} className="flex items-center gap-3">
                  {i > 0 && (
                    <span aria-hidden="true" className="opacity-50">
                      /
                    </span>
                  )}
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div aria-hidden="true" className="relative -mt-10 h-[92vw] max-h-[560px] lg:hidden">
        <HeroObjects />
      </div>
    </section>
  )
}
