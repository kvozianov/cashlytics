import type { Metadata } from "next"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { LedgerRow, MarginNote, Marker, Receipt, ReceiptRule, Stamp } from "@/components/brand"
import { Parallax } from "@/components/motion/parallax"
import { RevealLines } from "@/components/motion/reveal-lines"
import { SmoothScroll } from "@/components/motion/smooth-scroll"
import { CTA } from "@/components/sections/cta"
import { PageHero } from "@/components/sections/page-hero"
import { AnalyticsPreview, InsightsPreview, InvoicesPreview, TaxPreview, TrackingPreview } from "./previews"
import { ServicesIndex } from "./services-index"

export const metadata: Metadata = {
  title: "Services | Cashlytics",
  description:
    "Tracking, tax, analytics, invoices, and insights and learning: what each Cashlytics service does in the live demo today, what is planned, and the planned prices.",
}

const services = [
  {
    id: "tracking",
    title: "Income & expense tracking",
    description:
      "Every transaction in one list, filed into a category by a rule engine that shows its reasoning. You stay in control: correct anything, and the correction becomes a rule.",
    demo: ["Automatic categorisation", "Your own rules", "Review queue for unsure matches", "Search and filters", "CSV import and export"],
    planned: ["Bank sync", "Receipt scanning", "Multi-currency"],
    href: "/demo/transactions",
    price: 9,
    Preview: TrackingPreview,
  },
  {
    id: "tax",
    title: "Tax",
    description:
      "Know roughly what you owe while you are still earning it. The estimate uses illustrative rates you can change; it is a planning aid, not tax advice, and follows no country’s rules.",
    demo: ["Live estimate", "Quarterly schedule", "Deductible tracking", "Set-aside suggestion", "What-if scenarios"],
    planned: ["Country-specific rules", "Form preparation", "Audit trail"],
    href: "/demo/tax",
    price: 15,
    Preview: TaxPreview,
  },
  {
    id: "analytics",
    title: "Analytics",
    description:
      "See where the money goes and where it is heading: monthly cash flow, category trends, budgets and goals, and a forecast built from what repeats.",
    demo: ["Dashboard", "Trends", "Cash-flow forecast", "Budgets", "Goals"],
    planned: ["Custom reports", "Scheduled exports"],
    href: "/demo",
    price: 12,
    Preview: AnalyticsPreview,
  },
  {
    id: "invoices",
    title: "Invoices",
    description:
      "Bill clients and keep track of who has paid. A paid invoice is not a separate record: it becomes income and moves your tax estimate straight away.",
    demo: ["Create and preview", "Status tracking", "Mark paid (flows into income and tax)", "Print to PDF"],
    planned: ["Online payments", "Automatic reminders", "Recurring invoices", "Client portal"],
    href: "/demo/invoices",
    price: 10,
    Preview: InvoicesPreview,
  },
  {
    id: "insights",
    title: "Insights & learning",
    description:
      "The part that tells you what to fix. Rule-based checks score your financial health, find weak points and odd spending, and link each one to a short lesson.",
    demo: [
      "Health score",
      "Weak-point detection",
      "Subscription audit",
      "Spending anomalies",
      "Micro-lessons",
      "One-line quick add",
    ],
    planned: ["AI assistant for questions in plain language", "Predictive analytics"],
    href: "/demo/insights",
    price: 20,
    Preview: InsightsPreview,
  },
]

const bundle = {
  separately: services.reduce((sum, s) => sum + s.price, 0),
  price: 49,
}

export default function ServicesPage() {
  return (
    <>
      <SmoothScroll />
      <Header />
      <main id="main">
        <PageHero
          meta={["Services", "Five chapters, one ledger", "Nº 002"]}
          titleId="services-title"
          titleLines={[
            "Five services,",
            <>
              <Marker delay={420}>one set</Marker> of numbers.
            </>,
          ]}
          lede={
            <p>
              Each service lists what you can try in the live demo today and what is still planned. Prices are planned
              too: Cashlytics is a concept prototype and is not on sale.
            </p>
          }
          aside={
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4 lg:justify-end">
              <Stamp size="lg" rotate={-3} delay={300} subline="Not on sale">
                Prices planned
              </Stamp>
              <MarginNote arrow="left" tone="signal" delay={300} className="max-sm:hidden">
                the demo is free
              </MarginNote>
            </div>
          }
        />

        <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:grid grid-cols-[minmax(0,1fr)] lg:grid-cols-12 lg:gap-6 lg:px-12">
          <aside className="mb-12 lg:col-span-3 lg:mb-0">
            <div className="lg:sticky lg:top-24 lg:pl-4">
              <ServicesIndex items={[...services.map(({ id, title }) => ({ id, title })), { id: "bundle", title: "All five together" }]} />
            </div>
          </aside>

          <div className="lg:col-span-9">
            {services.map((service, index) => (
              <ServiceChapter key={service.id} service={service} index={index} />
            ))}
          </div>
        </div>

        <Bundle />
        <CTA />
      </main>
      <Footer />
    </>
  )
}

type Service = (typeof services)[number]

function ServiceChapter({ service, index }: { service: Service; index: number }) {
  const n = String(index + 1).padStart(2, "0")
  const Preview = service.Preview
  return (
    <article
      id={service.id}
      aria-labelledby={`${service.id}-title`}
      className="scroll-mt-20 border-t-2 border-foreground pt-6 pb-20 lg:pb-28"
    >
      <div className="flex items-start gap-5 sm:gap-8">
        <span
          aria-hidden="true"
          className="font-display text-[clamp(4rem,9vw,8.5rem)] leading-[0.78] font-extrabold tracking-[-0.06em] text-foreground"
        >
          {n}
        </span>
        <div className="min-w-0 pt-1">
          <p className="font-mono text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
            Service {n} of {String(services.length).padStart(2, "0")}
          </p>
          <RevealLines
            id={`${service.id}-title`}
            className="mt-2 font-display text-[clamp(2rem,4vw,3.75rem)] leading-[0.95] font-bold tracking-[-0.035em] text-balance"
            lines={[service.title]}
          />
        </div>
      </div>
      <p data-animate="" className="reveal mt-6 max-w-2xl text-[1.0625rem] leading-relaxed text-pretty text-muted-foreground">
        {service.description}
      </p>

      <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-12 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] xl:gap-10">
        <div>
          <section aria-labelledby={`${service.id}-demo`}>
            <h3 id={`${service.id}-demo`} className="flex items-end justify-between gap-4 border-b-2 border-foreground pb-3">
              <Stamp tone="success" size="sm" rotate={-2} delay={150}>
                In the demo
              </Stamp>
              <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase tabular-nums">
                {service.demo.length} working
              </span>
            </h3>
            <ul className="text-[0.95rem]">
              {service.demo.map((item, i) => (
                <LedgerRow
                  key={item}
                  as="li"
                  delay={i * 70}
                  label={item}
                  value="in demo"
                  tone="positive"
                  className="border-b border-border py-2.5"
                  valueClassName="text-[11px] tracking-[0.12em] uppercase"
                />
              ))}
            </ul>
          </section>

          <section aria-labelledby={`${service.id}-planned`} className="mt-10">
            <h3 id={`${service.id}-planned`} className="flex items-end justify-between gap-4 border-b-2 border-foreground pb-3">
              <Stamp tone="ink" size="sm" rotate={2} delay={250}>
                Planned
              </Stamp>
              <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase tabular-nums">
                not built yet
              </span>
            </h3>
            <ul className="text-[0.95rem] text-muted-foreground">
              {service.planned.map((item, i) => (
                <LedgerRow
                  key={item}
                  as="li"
                  delay={i * 70}
                  label={item}
                  value="planned"
                  tone="muted"
                  className="border-b border-border py-2.5"
                  valueClassName="text-[11px] tracking-[0.12em] uppercase"
                />
              ))}
            </ul>
          </section>

          <div className="mt-10 font-mono text-sm">
            <LedgerRow total label="Planned price" value={`$${service.price} / month`} />
          </div>
          <Link href={service.href} className="btn-ink mt-6 h-12 px-6 text-[0.95rem]">
            Try it in the demo <span aria-hidden="true">→</span>
          </Link>
        </div>

        <Parallax offset={70} rotate={index % 2 === 0 ? -1.4 : 1.4} className="xl:pt-6">
          <figure className="paper px-4 pt-6 pb-7 sm:px-6">
            <figcaption className="mb-4 flex items-baseline justify-between gap-3 border-b border-foreground/80 pb-2 font-mono text-[10.5px] tracking-[0.14em] text-muted-foreground uppercase">
              <span>
                Fig. {n} · {service.title}
              </span>
              <span className="shrink-0">Illustrative data</span>
            </figcaption>
            <Preview />
            <Link
              href={service.href}
              className="mt-5 inline-flex items-center gap-1.5 font-mono text-[11px] font-medium tracking-[0.14em] uppercase underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              Open the real screen <span aria-hidden="true">↗</span>
            </Link>
          </figure>
        </Parallax>
      </div>
    </article>
  )
}

function Bundle() {
  return (
    <section id="bundle" aria-labelledby="bundle-title" className="scroll-mt-20 border-t border-border py-20 lg:py-28">
      <div className="mx-auto grid grid-cols-[minmax(0,1fr)] max-w-[1440px] gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:px-12">
        <div className="lg:col-span-5">
          <p className="font-mono text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">Planned bundle</p>
          <RevealLines
            id="bundle-title"
            className="mt-4 font-display text-[clamp(2.25rem,4.4vw,4.25rem)] leading-[0.96] font-bold tracking-[-0.035em]"
            lines={["All five", "together."]}
          />
          <p data-animate="" className="reveal mt-6 max-w-md leading-relaxed text-pretty text-muted-foreground">
            A bundle price for all five services, because they are most useful when they share the same data. Like
            every price on this site, it is planned and not on sale.
          </p>
          <div className="mt-8">
            <Stamp size="lg" rotate={-3} subline="Not on sale">
              Planned
            </Stamp>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
            <Link href="/demo" className="btn-ink h-12 px-6">
              Try the demo <span aria-hidden="true">→</span>
            </Link>
            <Link href="/pricing" className="py-2 font-medium underline decoration-1 underline-offset-[6px] hover:decoration-2">
              See planned pricing
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 lg:col-start-8">
          <div aria-hidden="true" className="relative z-10 mx-[-10px] h-2.5 rounded-[2px] bg-foreground" />
          <Receipt edge="bottom" printMs={1400} className="pt-6 text-[12.5px]">
            <div className="flex justify-between text-[10.5px] tracking-[0.16em] text-muted-foreground uppercase">
              <span>Cashlytics</span>
              <span>Bundle · planned</span>
            </div>
            <ReceiptRule className="mt-4" />
            <ul className="space-y-1.5">
              {services.map((s) => (
                <LedgerRow key={s.id} as="li" still label={s.title} value={`$${s.price}`} />
              ))}
            </ul>
            <ReceiptRule />
            <LedgerRow
              still
              label="Separately"
              value={
                <Marker variant="strike" delay={1300}>
                  ${bundle.separately} / mo
                </Marker>
              }
              tone="muted"
            />
            <p className="mt-3 flex items-baseline justify-between gap-3">
              <span className="tracking-[0.12em] uppercase">All five</span>
              <span className="text-[2.25rem] leading-none font-medium tracking-[-0.04em] tabular-nums">
                ${bundle.price}
                <span className="ml-1 text-sm tracking-normal text-muted-foreground">/ month</span>
              </span>
            </p>
            <ReceiptRule />
            <LedgerRow still label="Due today" value="$0.00" />
            <p className="mt-1 text-[11px] text-muted-foreground">Nothing is charged anywhere on this site.</p>
          </Receipt>
        </div>
      </div>
    </section>
  )
}
