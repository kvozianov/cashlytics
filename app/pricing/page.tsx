import type { Metadata } from "next"
import type { CSSProperties } from "react"
import Link from "next/link"
import { Fragment } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Marker, Stamp } from "@/components/brand"
import { RevealLines } from "@/components/motion/reveal-lines"
import { SmoothScroll } from "@/components/motion/smooth-scroll"
import { PageHero } from "@/components/sections/page-hero"
import { PlanCard } from "@/components/sections/plan-card"
import { plans } from "@/components/sections/plans"

export const metadata: Metadata = {
  title: "Planned pricing | Cashlytics",
  description:
    "The pricing planned for Cashlytics, a concept prototype that is not on sale. Nothing can be bought here; the live demo is free and needs no account.",
}

type Cell = boolean | string

type Row = { name: string; planned?: boolean; basic: Cell; pro: Cell; business: Cell }

const comparison: { category: string; rows: Row[] }[] = [
  {
    category: "Manage",
    rows: [
      { name: "Income and expense tracking", basic: true, pro: true, business: true },
      { name: "Automatic categories and your own rules", basic: true, pro: true, business: true },
      { name: "CSV import and export", basic: true, pro: true, business: true },
      { name: "Bank sync", planned: true, basic: "2 accounts", pro: "Unlimited", business: "Unlimited" },
      { name: "Receipt scanning", planned: true, basic: false, pro: true, business: true },
    ],
  },
  {
    category: "Plan",
    rows: [
      { name: "Dashboard, budgets and goals", basic: true, pro: true, business: true },
      { name: "Tax estimate, schedule and set-aside", basic: false, pro: true, business: true },
      { name: "Cash-flow forecast", basic: false, pro: true, business: true },
      { name: "Invoices", basic: "5 a month", pro: "Unlimited", business: "Unlimited" },
      { name: "Online invoice payments", planned: true, basic: false, pro: false, business: true },
    ],
  },
  {
    category: "Learn",
    rows: [
      { name: "Micro-lessons", basic: true, pro: true, business: true },
      { name: "Health score and weak points", basic: false, pro: true, business: true },
      { name: "AI assistant", planned: true, basic: false, pro: false, business: true },
    ],
  },
  {
    category: "Team",
    rows: [
      { name: "People per account", planned: true, basic: "1", pro: "1", business: "Up to 10" },
      { name: "Custom reports", planned: true, basic: false, pro: false, business: true },
    ],
  },
]

const faqs = [
  {
    question: "Can I sign up or buy a plan?",
    answer:
      "Not yet. Cashlytics is a concept prototype, not a running service, so there are no accounts and no payments. The prices on this page are the ones we planned. The live demo is free and needs no account.",
  },
  {
    question: "Is my data safe in the demo?",
    answer:
      "The demo starts with fictional data generated in your browser. Anything you add or change is kept in your browser’s local storage and is never sent to a server. You can reset it at any time.",
  },
  {
    question: "Where do the tax numbers come from?",
    answer:
      "From illustrative flat rates (20% for the freelancer and the coffee kiosk, 15% on the side income in the first-job persona) that you can change on the tax screen. They follow no country’s law and are not tax advice.",
  },
  {
    question: "Is any of this AI?",
    answer:
      "No. Categorisation and insights in the demo are rule-based, and each result shows the rule behind it. An AI assistant that answers questions in plain language is on the planned list.",
  },
  {
    question: "What does “Planned” mean on a feature?",
    answer:
      "It is part of the product design but not built. Everything without that label can be tried in the demo today.",
  },
  {
    question: "Who built this?",
    answer:
      "Kirill Vozianov built the prototype as part of a two-person team for the TeenMBA final at De Montfort University Kazakhstan in April 2026, where the project took 1st place. The full story is on the About page.",
  },
]

const drop = ["lg:mt-0", "lg:mt-16", "lg:mt-6"]

export default function PricingPage() {
  return (
    <>
      <SmoothScroll />
      <Header />
      <main id="main">
        <PageHero
          meta={["Planned pricing", "Three plans, none on sale", "Nº 003"]}
          titleId="pricing-title"
          titleLines={["What Cashlytics", <>would <Marker delay={420}>cost.</Marker></>]}
          lede={
            <>
              <p>These are the plans designed for a future launch. Cashlytics is a concept prototype and is not on sale.</p>
              <p
                role="note"
                className="mt-6 border-l-2 border-foreground pl-4 text-[0.95rem] leading-relaxed text-foreground"
              >
                You can’t sign up or pay for anything on this site. Features marked{" "}
                <span className="rounded-[2px] border border-dashed border-foreground/60 px-1.5 py-px font-mono text-[11px] tracking-[0.1em] whitespace-nowrap uppercase">
                  Planned
                </span>{" "}
                are not built yet; everything else works in the free live demo.
              </p>
            </>
          }
          aside={
            <div className="flex lg:justify-end">
              <Stamp size="lg" rotate={-3} delay={300} subline="Not on sale" className="lg:px-7 lg:py-4 lg:text-lg">
                Planned
              </Stamp>
            </div>
          }
        />

        <section aria-label="Planned plans" className="overflow-x-clip pb-24 lg:pb-32">
          <div className="mx-auto grid grid-cols-[minmax(0,1fr)] max-w-[1440px] gap-x-10 gap-y-20 px-5 pt-12 sm:px-8 md:grid-cols-2 lg:grid-cols-3 lg:px-12">
            {plans.map((plan, i) => (
              <PlanCard key={plan.id} plan={plan} delay={i * 220} className={drop[i]} />
            ))}
          </div>
        </section>

        <section aria-labelledby="compare-title" className="border-t border-border py-20 lg:py-28">
          <div className="mx-auto grid grid-cols-[minmax(0,1fr)] max-w-[1440px] gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:px-12">
            <div className="lg:col-span-3">
              <p className="font-mono text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">Ledger</p>
              <RevealLines
                id="compare-title"
                className="mt-4 font-display text-[clamp(2.25rem,3.2vw,3.25rem)] leading-[0.96] font-bold tracking-[-0.035em]"
                lines={["Compare the", "planned plans."]}
              />
              <p className="mt-6 max-w-xs font-mono text-[11px] leading-relaxed tracking-[0.06em] text-muted-foreground uppercase">
                ✓ included · — not included · dashed tag = planned, not built
              </p>
            </div>

            <div className="lg:col-span-9">
              <p aria-hidden="true" className="mb-3 font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase md:hidden">
                Swipe the table sideways →
              </p>
              <div className="-mx-5 overflow-x-auto overflow-y-hidden px-5 sm:mx-0 sm:px-0" data-lenis-prevent>
                <table className="w-full min-w-[640px] border-collapse text-[0.95rem]">
                  <caption className="sr-only">Planned plan comparison. Rows marked planned are not built yet.</caption>
                  <thead>
                    <tr className="border-b-2 border-foreground">
                      <th scope="col" className="py-3 pr-4 text-left font-mono text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                        Feature
                      </th>
                      {plans.map((plan) => (
                        <th key={plan.id} scope="col" className="w-[17%] px-3 py-3 text-right align-bottom">
                          <span className="block font-display text-xl font-bold tracking-[-0.02em]">{plan.name}</span>
                          <span className="font-mono text-[11px] font-normal text-muted-foreground tabular-nums">
                            ${plan.price} / mo, planned
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((group, g) => (
                      <Fragment key={group.category}>
                        <tr>
                          <th
                            scope="colgroup"
                            colSpan={4}
                            className="pt-8 pb-2 text-left font-mono text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase"
                          >
                            <span className="text-foreground tabular-nums">{String(g + 1).padStart(2, "0")}</span> — {group.category}
                          </th>
                        </tr>
                        {group.rows.map((row) => (
                          <tr key={row.name} data-animate="" className="relative border-t border-border">
                            <th scope="row" className="py-3 pr-4 text-left font-normal">
                              <span className={row.planned ? "text-muted-foreground" : "text-foreground"}>{row.name}</span>
                              {row.planned && (
                                <span className="ml-2 inline-block rounded-[2px] border border-dashed border-foreground/60 px-1.5 py-px align-[1px] font-mono text-[10.5px] tracking-[0.1em] whitespace-nowrap text-muted-foreground uppercase">
                                  Planned
                                </span>
                              )}
                            </th>
                            {(["basic", "pro", "business"] as const).map((k, i) => (
                              <td
                                key={k}
                                className="reveal px-3 py-3 text-right"
                                style={{ "--d": `${120 + i * 80}ms` } as CSSProperties}
                              >
                                <CellValue value={row[k]} />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="faq-title" className="border-t border-border py-20 lg:py-28">
          <div className="mx-auto grid grid-cols-[minmax(0,1fr)] max-w-[1440px] gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:px-12">
            <div className="lg:col-span-4">
              <div className="lg:sticky lg:top-28">
                <p className="font-mono text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
                  Honest answers
                </p>
                <RevealLines
                  id="faq-title"
                  className="mt-4 font-display text-[clamp(2.25rem,4vw,3.75rem)] leading-[0.96] font-bold tracking-[-0.035em]"
                  lines={["Questions."]}
                />
              </div>
            </div>
            <div className="border-t-2 border-foreground lg:col-span-8">
              {faqs.map((faq, i) => (
                <details key={faq.question} className="faq group border-b border-border">
                  <summary className="flex cursor-pointer list-none items-baseline gap-5 py-5 [&::-webkit-details-marker]:hidden">
                    <span className="w-10 shrink-0 font-mono text-[12px] text-muted-foreground tabular-nums">
                      Q.{String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 font-display text-[1.3rem] leading-snug font-semibold tracking-[-0.015em] sm:text-2xl">
                      {faq.question}
                    </span>
                    <span
                      aria-hidden="true"
                      className="font-mono text-xl leading-none text-muted-foreground transition-transform duration-200 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="faq-answer max-w-2xl pb-6 pl-15 leading-relaxed text-muted-foreground">
                    {faq.answer}
                    {faq.question === "Who built this?" && (
                      <>
                        {" "}
                        <Link href="/about" className="font-medium text-foreground underline underline-offset-4">
                          Read the project story
                        </Link>
                        .
                      </>
                    )}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="pricing-cta-title" className="bg-primary py-24 text-primary-foreground lg:py-32">
          <div className="mx-auto grid grid-cols-[minmax(0,1fr)] max-w-[1440px] items-end gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:px-12">
            <div className="lg:col-span-7">
              <RevealLines
                id="pricing-cta-title"
                className="font-display text-[clamp(2.75rem,6.5vw,6.5rem)] leading-[0.92] font-extrabold tracking-[-0.045em]"
                lines={[<>The demo is <Marker key="f" delay={500}>free.</Marker></>]}
              />
              <p className="mt-6 max-w-xl text-lg leading-relaxed opacity-80">
                Every feature without a Planned label runs in your browser on fictional data. No account needed.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-7 gap-y-4 lg:col-span-5 lg:justify-end">
              <Link href="/demo" className="btn-ink h-14 bg-primary-foreground px-8 text-lg text-primary">
                Try the demo <span aria-hidden="true">→</span>
              </Link>
              <Link href="/services" className="py-2 font-medium underline decoration-1 underline-offset-[6px] hover:decoration-2">
                See the services
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

function CellValue({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <>
        <span aria-hidden="true" className="font-mono text-success">
          ✓
        </span>
        <span className="sr-only">Included</span>
      </>
    )
  }
  if (value === false) {
    return (
      <>
        <span aria-hidden="true" className="font-mono text-muted-foreground/60">
          —
        </span>
        <span className="sr-only">Not included</span>
      </>
    )
  }
  return <span className="font-mono text-[0.85rem] text-foreground tabular-nums">{value}</span>
}
