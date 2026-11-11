import Link from "next/link"
import { Eyebrow, Stamp } from "@/components/brand"
import { RevealLines } from "@/components/motion/reveal-lines"
import { PlanCard } from "./plan-card"
import { plans } from "./plans"

const drop = ["lg:mt-0", "lg:mt-20", "lg:mt-8"]

export function PricingPreview() {
  return (
    <section id="pricing" aria-labelledby="pricing-preview-title" className="overflow-x-clip border-t border-border py-20 lg:py-32">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-5">
            <Eyebrow>Planned pricing</Eyebrow>
            <RevealLines
              id="pricing-preview-title"
              className="mt-5 font-display text-[clamp(2.25rem,4.4vw,4.25rem)] leading-[0.96] font-bold tracking-[-0.035em]"
              lines={["How it would", "be priced."]}
            />
          </div>
          <p data-animate="" className="reveal max-w-md leading-relaxed text-pretty text-muted-foreground lg:col-span-4 lg:col-start-8 lg:self-end">
            Cashlytics is not on sale, so nobody can buy it today. These are the plans we designed for a future launch.
            The demo is free and needs no account.
          </p>
          <div className="lg:col-span-12 lg:-mb-6 lg:flex lg:justify-end">
            <Stamp size="lg" rotate={-3} delay={300} subline="Not on sale">
              Planned
            </Stamp>
          </div>
        </div>

        <div className="relative mt-24 grid gap-x-8 gap-y-24 md:grid-cols-2 lg:mt-28 lg:grid-cols-3 lg:gap-x-10">
          {plans.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} compact delay={i * 220} className={drop[i]} />
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
            Prices are planned and may change. Nothing is charged anywhere on this site.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 font-medium underline decoration-1 underline-offset-[6px] hover:decoration-2"
          >
            See all planned plans <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
