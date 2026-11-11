import Link from "next/link"
import { Marker } from "@/components/brand"
import { Magnetic } from "@/components/motion/magnetic"
import { RevealLines } from "@/components/motion/reveal-lines"
import { Coin } from "./scenes"

export function CTA() {
  return (
    <section aria-labelledby="cta-title" className="relative overflow-x-clip bg-primary py-24 text-primary-foreground lg:py-36">
      <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:px-12">
        <div className="relative z-10 lg:col-span-8">
          <RevealLines
            id="cta-title"
            className="font-display text-[clamp(2.75rem,7vw,7.5rem)] leading-[0.92] font-extrabold tracking-[-0.045em]"
            lines={[
              "Two minutes",
              <>
                is <Marker delay={600}>enough</Marker> to see
              </>,
              "how it fits together.",
            ]}
          />
          <p data-animate="" className="reveal mt-8 max-w-xl text-lg leading-relaxed text-pretty opacity-80">
            Open the demo, pick a persona, and mark an invoice paid. Income, the tax estimate and the health score all
            change at once. No sign-up, and nothing you enter leaves your browser.
          </p>
          <div className="mt-10">
            <Magnetic>
              <Link
                href="/demo"
                className="btn-ink h-16 bg-primary-foreground px-9 text-lg text-primary focus-visible:outline-primary-foreground"
              >
                Open the live demo
                <span aria-hidden="true">→</span>
              </Link>
            </Magnetic>
          </div>
        </div>
        <div aria-hidden="true" className="relative mx-auto aspect-square w-[min(80vw,420px)] lg:col-span-4 lg:w-[115%] lg:max-w-none">
          <Coin />
        </div>
      </div>
    </section>
  )
}
