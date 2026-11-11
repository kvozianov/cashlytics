import type { Metadata } from "next"
import type { CSSProperties } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer, GITHUB_URL } from "@/components/footer"
import { Eyebrow, MarginNote, Marker, Stamp } from "@/components/brand"
import { RevealLines } from "@/components/motion/reveal-lines"
import { SmoothScroll } from "@/components/motion/smooth-scroll"
import { Tilt } from "@/components/motion/tilt"
import { PageHero } from "@/components/sections/page-hero"
import { RoadmapTimeline } from "./roadmap"

export const metadata: Metadata = {
  title: "About the project | Cashlytics",
  description:
    "How Cashlytics started: a concept built in April 2026 by a two-person team for the TeenMBA final at De Montfort University Kazakhstan, where it took 1st place. What is real today and what is not.",
}

const facts = [
  { label: "Built", value: "April 2026" },
  { label: "For", value: "TeenMBA final, De Montfort University Kazakhstan" },
  { label: "Team", value: "Two people" },
  { label: "Result", value: "1st place and a 35% tuition scholarship" },
]

const audience = [
  { title: "Young adults with a first stable income", detail: "Learning to budget, save and handle a side income for the first time." },
  { title: "Freelancers and small business owners", detail: "Irregular cash flow, invoices to chase and tax that nobody withholds for them." },
  { title: "Busy professionals", detail: "Want a clear picture without spending evenings on spreadsheets." },
  { title: "People with several income streams", detail: "A salary, a side project and some freelance work, all taxed and tracked differently." },
]

const painPoints = [
  "Poor financial organisation",
  "Hard tax calculation and paperwork",
  "Limited financial knowledge",
  "Manual tracking",
  "No way to spot weak points in a financial strategy",
  "Too many separate tools",
]

const value = [
  "Money management, tax calculation and education in one tool",
  "Finds the weak points in a user’s financial strategy",
  "Automates routine paperwork",
  "Works for individuals and for small businesses",
  "Easy for people with little financial experience",
]

const roadmap = [
  { step: 1, title: "MVP launch", detail: "A first working product with real accounts for a small group of users." },
  { step: 2, title: "Feature expansion", detail: "Integrations such as bank connections and receipt capture." },
  { step: 3, title: "Scaling users", detail: "Grow from early users to a wider audience." },
  { step: 4, title: "Monetisation optimisation", detail: "Test and tune the planned subscription plans." },
  { step: 5, title: "Mass market", detail: "A product for anyone who earns and wants to understand their money." },
]

const realToday = [
  "This website and the live demo at /demo",
  "Three fictional personas with 13 months of generated transactions",
  "Rule-based categorisation, tax estimate, invoices, budgets, goals, insights and lessons, all working in the browser",
  "Open-source code on GitHub",
]

const notReal = [
  "No backend, no accounts and no sign-up",
  "No connection to any bank",
  "No customers and no revenue",
  "No AI: everything automatic is rule-based",
  "Tax figures are illustrative, not advice for any country",
]

const h2 = "font-display text-[clamp(2.25rem,4.4vw,4.25rem)] leading-[0.96] font-bold tracking-[-0.035em] text-balance"
const tilts = [-2.2, 1.4, -0.8, 2]

export default function AboutPage() {
  return (
    <>
      <SmoothScroll />
      <Header />
      <main id="main">
        <PageHero
          meta={["Case file", "About the project", "Nº 001"]}
          titleId="about-title"
          titleLines={[
            "A school competition idea,",
            "turned into something",
            <>
              <Marker delay={420}>you can use.</Marker>
            </>,
          ]}
          lede={
            <p>
              Cashlytics is a concept for a financial-analytics service for individuals, freelancers and small
              businesses, built around three ideas: manage, plan, learn.
            </p>
          }
          aside={<Dossier />}
        />

        {/* Story */}
        <section aria-labelledby="story-title" className="border-t border-border py-20 lg:py-28">
          <div className="mx-auto grid grid-cols-[minmax(0,1fr)] max-w-[1440px] gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:px-12">
            <div className="lg:col-span-3">
              <Eyebrow index={1}>The story</Eyebrow>
              <h2 id="story-title" className="sr-only">
                The story
              </h2>
            </div>
            <div className="space-y-6 text-[1.125rem] leading-relaxed text-pretty text-muted-foreground lg:col-span-6">
              <p data-animate="" className="reveal text-foreground">
                Cashlytics was built in April 2026 by a two-person school team for the TeenMBA final at De Montfort
                University Kazakhstan. The project <Marker delay={300}>took 1st place</Marker>, and with it a 35% tuition
                scholarship.
              </p>
              <p data-animate="" className="reveal">
                Kirill Vozianov built the prototype and led the market and audience research. The team developed the
                strategy and the financial model together.
              </p>
              <p data-animate="" className="reveal">
                The research pointed to a gap. People who start earning on their own, from a first job, freelance work
                or a small business, have to track money, plan for tax and make sensible decisions, often with little
                financial knowledge and a handful of tools that do not talk to each other. Cashlytics puts those jobs
                in one place and explains itself along the way.
              </p>
              <p data-animate="" className="reveal">
                Since the final, the prototype has grown into a clickable demo that runs entirely in the browser on
                fictional data, so anyone can try the product instead of reading about it.
              </p>
            </div>
            <div className="hidden lg:col-span-3 lg:flex lg:flex-col lg:justify-end lg:pb-3">
              <MarginNote arrow="left" tone="signal" rotate={-4} size="lg">
                so you can try it, not just read about it
              </MarginNote>
            </div>
          </div>
        </section>

        {/* Research */}
        <section aria-labelledby="research-title" className="overflow-x-clip border-t border-border py-20 lg:py-28">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-12 lg:gap-6">
              <div className="lg:col-span-6">
                <Eyebrow index={2}>Audience research</Eyebrow>
                <RevealLines id="research-title" className={`mt-5 ${h2}`} lines={["Who we were", "designing for."]} />
              </div>
              <p data-animate="" className="reveal max-w-md leading-relaxed text-pretty text-muted-foreground lg:col-span-4 lg:col-start-9 lg:self-end">
                A summary of the research presented in the pitch: four audience groups, the problems they share, and
                what Cashlytics would do differently.
              </p>
            </div>

            <ul className="mt-14 grid grid-cols-[minmax(0,1fr)] gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {audience.map((group, i) => (
                <li key={group.title} data-animate="" className="reveal" style={{ "--d": `${i * 90}ms` } as CSSProperties}>
                  <Tilt max={5} className="h-full">
                    <div
                      className="ruled relative flex h-full flex-col rounded-[4px] border border-foreground/60 bg-card px-5 pt-4 pb-6 shadow-[3px_3px_0_0_var(--foreground)] [--rule:1.75rem]"
                      style={{ rotate: `${tilts[i]}deg` }}
                    >
                      <span aria-hidden="true" className="absolute inset-x-0 top-[2.6rem] h-px bg-signal/70" />
                      <span className="font-mono text-[10.5px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                        Group {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="mt-7 font-display text-[1.4rem] leading-[1.1] font-bold tracking-[-0.02em]">{group.title}</h3>
                      <p className="mt-2 text-[0.95rem] leading-[1.75rem] text-muted-foreground">{group.detail}</p>
                    </div>
                  </Tilt>
                </li>
              ))}
            </ul>

            <div className="mt-20 grid grid-cols-[minmax(0,1fr)] gap-12 lg:grid-cols-2 lg:gap-10">
              <div>
                <h3 className="flex items-baseline justify-between border-b-2 border-foreground pb-2 font-mono text-[11px] font-medium tracking-[0.18em] uppercase">
                  Pain points they share
                  <span className="text-muted-foreground tabular-nums">{painPoints.length}</span>
                </h3>
                <ol>
                  {painPoints.map((point, i) => (
                    <li key={point} className="flex items-baseline gap-4 border-b border-border py-3">
                      <span className="w-6 shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[1.05rem]">
                        <Marker variant="strike" delay={200 + i * 90}>
                          {point}
                        </Marker>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
              <div>
                <h3 className="flex items-baseline justify-between border-b-2 border-foreground pb-2 font-mono text-[11px] font-medium tracking-[0.18em] uppercase">
                  What Cashlytics offers instead
                  <span className="text-muted-foreground tabular-nums">{value.length}</span>
                </h3>
                <ol>
                  {value.map((point, i) => (
                    <li
                      key={point}
                      data-animate=""
                      className="reveal flex items-baseline gap-4 border-b border-border py-3"
                      style={{ "--d": `${300 + i * 90}ms` } as CSSProperties}
                    >
                      <span aria-hidden="true" className="w-6 shrink-0 font-mono text-success">
                        →
                      </span>
                      <span className="text-[1.05rem]">{point}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <p className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground">
              The three demo personas are fictional people built from these groups.
              <Link href="/#who-its-for" className="font-medium text-foreground underline decoration-1 underline-offset-[6px] hover:decoration-2">
                Meet them
              </Link>
            </p>
          </div>
        </section>

        {/* Roadmap */}
        <section aria-labelledby="roadmap-title" className="border-t border-border py-20 lg:py-28">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-12 lg:gap-6">
              <div className="lg:col-span-7">
                <Eyebrow index={3}>Roadmap</Eyebrow>
                <RevealLines
                  id="roadmap-title"
                  className={`mt-5 ${h2}`}
                  lines={["Five steps from the pitch,", "and where the project is now."]}
                />
              </div>
              <p data-animate="" className="reveal max-w-md leading-relaxed text-pretty text-muted-foreground lg:col-span-4 lg:col-start-9 lg:self-end">
                The roadmap from the pitch deck. None of the five steps has started: the project is a clickable
                prototype.
              </p>
            </div>
            <div className="mt-20">
              <RoadmapTimeline steps={roadmap} />
            </div>
          </div>
        </section>

        {/* Real vs not */}
        <section aria-labelledby="status-title" className="border-t border-border py-20 lg:py-28">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12">
            <Eyebrow index={4}>Status</Eyebrow>
            <RevealLines id="status-title" className={`mt-5 ${h2}`} lines={["What is real today,", "and what is not."]} />

            <div className="mt-14 grid grid-cols-[minmax(0,1fr)] gap-14 lg:grid-cols-2 lg:gap-10">
              <StatusColumn tone="success" stamp="Real" items={realToday} mark="✓" />
              <StatusColumn tone="signal" stamp="Not real (yet)" items={notReal} mark="✗" />
            </div>

            <div className="mt-14 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Link href="/demo" className="btn-ink h-14 px-7 text-base">
                Try the live demo <span aria-hidden="true">→</span>
              </Link>
              <Link href="/demo/about" className="py-2 font-medium underline decoration-1 underline-offset-[6px] hover:decoration-2">
                How the demo works
              </Link>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="py-2 font-medium underline decoration-1 underline-offset-[6px] hover:decoration-2"
              >
                View the code on GitHub ↗<span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

function Dossier() {
  return (
    <div className="paper px-5 pt-6 pb-7 sm:px-7" data-edge="top">
      <div className="flex items-start justify-between gap-4 border-b-2 border-foreground pb-3">
        <div>
          <p className="font-mono text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">Dossier</p>
          <p className="mt-1 font-display text-2xl font-bold tracking-[-0.02em]">Cashlytics</p>
        </div>
        <Stamp size="sm" rotate={3} delay={350} subline="TeenMBA final 2026">
          1st place
        </Stamp>
      </div>
      <dl className="text-[0.95rem]">
        {facts.map((fact) => (
          <div key={fact.label} className="grid grid-cols-[5.5rem_1fr] gap-3 border-b border-border py-2.5">
            <dt className="pt-0.5 font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">{fact.label}</dt>
            <dd className="text-foreground">{fact.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link href="/demo" className="btn-ink h-11 px-5 text-sm">
          Open the live demo <span aria-hidden="true">→</span>
        </Link>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[11px] font-medium tracking-[0.14em] uppercase underline decoration-1 underline-offset-4 hover:decoration-2"
        >
          Code on GitHub ↗<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </div>
  )
}

function StatusColumn({
  tone,
  stamp,
  items,
  mark,
}: {
  tone: "success" | "signal"
  stamp: string
  items: string[]
  mark: string
}) {
  return (
    <div>
      <h3 className="flex items-end justify-between border-b-2 border-foreground pb-3">
        <Stamp tone={tone} size="md" rotate={tone === "success" ? -2 : 2}>
          {stamp}
        </Stamp>
        <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase tabular-nums">
          {items.length} lines
        </span>
      </h3>
      <ol>
        {items.map((item, i) => (
          <li
            key={item}
            data-animate=""
            className="reveal flex items-baseline gap-4 border-b border-border py-3.5"
            style={{ "--d": `${i * 80}ms` } as CSSProperties}
          >
            <span aria-hidden="true" className={tone === "success" ? "w-5 shrink-0 font-mono text-success" : "w-5 shrink-0 font-mono text-destructive"}>
              {mark}
            </span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
