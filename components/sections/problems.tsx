import type { CSSProperties } from "react"
import { Eyebrow, Marker } from "@/components/brand"
import { RevealLines } from "@/components/motion/reveal-lines"

const pairs = [
  {
    problem: "Money is scattered",
    problemDetail: "Statements, spreadsheets and receipts in different places, with no single picture of where things stand.",
    answer: "One overview of income, spending, balances and what is still owed to you.",
  },
  {
    problem: "Tracking is manual",
    problemDetail: "Typing transactions in and sorting them by hand is the first habit people drop.",
    answer: "Automatic, rule-based categories with the reason shown, a review queue for unsure ones, and CSV import.",
  },
  {
    problem: "Tax is a yearly surprise",
    problemDetail: "Without an employer withholding it, people with side or irregular income find out what they owe too late.",
    answer: "A running estimate as you earn, a quarterly schedule and a suggested amount to set aside from each payment.",
  },
  {
    problem: "Weak points stay hidden",
    problemDetail: "A late-paying client, a thin buffer or subscription creep rarely shows up until it hurts.",
    answer: "A financial health score and a list of weak points ranked by impact, each with real numbers and one next step.",
  },
  {
    problem: "Not much financial knowledge",
    problemDetail: "Generic advice is easy to find and hard to apply to your own situation.",
    answer: "Two-minute lessons that end with a sentence about your own numbers.",
  },
  {
    problem: "Too many separate tools",
    problemDetail: "A budgeting app, an invoicing tool, a tax spreadsheet: none of them know about each other.",
    answer: "Invoices, transactions, tax and goals share the same data. Mark an invoice paid and everything updates.",
  },
]

export function Problems() {
  return (
    <section id="problems" aria-labelledby="problems-title" className="border-t border-border py-20 lg:py-32">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:px-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <Eyebrow>The problem</Eyebrow>
            <RevealLines
              id="problems-title"
              className="mt-5 font-display text-[clamp(2.25rem,4.2vw,4rem)] leading-[0.96] font-bold tracking-[-0.035em]"
              lines={["Six problems", "we set out", "to solve."]}
            />
            <p data-animate="" className="reveal mt-6 max-w-sm leading-relaxed text-pretty text-muted-foreground">
              The pain points from our audience research with young earners, freelancers and small business owners, and
              the part of the product that answers each one.
            </p>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="hidden grid-cols-[3rem_1fr_1fr] gap-6 border-b-2 border-foreground pb-3 font-mono text-[10.5px] font-medium tracking-[0.18em] text-muted-foreground uppercase md:grid">
            <span>Nº</span>
            <span>The problem</span>
            <span>What Cashlytics does</span>
          </div>
          <ol>
            {pairs.map((pair, i) => (
              <li
                key={pair.problem}
                data-animate=""
                className="relative grid gap-x-6 gap-y-3 py-7 md:grid-cols-[3rem_1fr_1fr] md:py-8"
                style={{ "--d": "60ms" } as CSSProperties}
              >
                <span aria-hidden="true" className="rule-draw absolute inset-x-0 bottom-0 h-px bg-border" />
                <span className="font-mono text-sm text-muted-foreground tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-display text-[1.45rem] leading-tight font-semibold tracking-[-0.02em]">
                    <Marker variant="strike" delay={350}>
                      {pair.problem}
                    </Marker>
                  </h3>
                  <p className="mt-2 text-[0.95rem] leading-relaxed text-muted-foreground">{pair.problemDetail}</p>
                </div>
                <div className="reveal flex gap-3 md:pt-1.5" style={{ "--d": "550ms" } as CSSProperties}>
                  <span aria-hidden="true" className="font-mono text-success">
                    →
                  </span>
                  <p className="leading-relaxed text-foreground">
                    <span className="sr-only">How Cashlytics answers it: </span>
                    {pair.answer}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
