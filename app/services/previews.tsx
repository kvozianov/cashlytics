import {
  ArrowRight,
  Check,
  CircleAlert,
  Clock,
  GraduationCap,
  PenLine,
  Search,
  Send,
  TriangleAlert,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Static, illustrative mock-ups of the demo screens. The numbers are chosen to
// add up, but they are not read from the demo.

function usd(value: number, decimals = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

function signed(value: number) {
  return value >= 0 ? `+${usd(value, 2)}` : `−${usd(Math.abs(value), 2)}`
}

function Amount({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("font-mono tabular-nums", value > 0 ? "text-success" : "text-foreground", className)}>
      {signed(value)}
    </span>
  )
}

/* ------------------------------------------------------------------ */

const txRows = [
  { date: "Nov 10", description: "NORTHWIND STUDIO INV-014", category: "Client income", dot: "bg-cat-3", amount: 2400 },
  { date: "Nov 9", description: "WEWORK *MEMBERSHIP", category: "Coworking", dot: "bg-cat-1", amount: -350, reason: "Your rule: “wework”" },
  { date: "Nov 9", description: "UBER *TRIP HELP.UBER.COM", category: "Transport", dot: "bg-cat-9", amount: -18.4, reason: "Matched “uber”" },
  { date: "Nov 8", description: "AMZN MKTP US*2K4L1", category: null, dot: "", amount: -84.12 },
]

export function TrackingPreview() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 flex-1 items-center gap-2 rounded-[3px] border border-border bg-background px-2.5 text-[13px] text-muted-foreground">
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          Search transactions
        </div>
        <span className="inline-flex h-8 items-center gap-1.5 rounded-[3px] border-[1.5px] border-warning px-2.5 font-mono text-[11px] tracking-[0.1em] text-warning uppercase">
          <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
          Review 3
        </span>
      </div>

      <ul className="divide-y divide-border border-y border-foreground/70">
        {txRows.map((tx) => (
          <li key={tx.description} className="px-3 py-2.5">
            <div className="flex items-center gap-3">
              <span className="w-11 shrink-0 text-[11px] text-muted-foreground tabular-nums">{tx.date}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[12px] text-foreground">{tx.description}</p>
                {tx.category ? (
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className={cn("h-1.5 w-1.5", tx.dot)} aria-hidden="true" />
                    {tx.category}
                    {tx.reason && <span className="hidden sm:inline">· {tx.reason}</span>}
                  </p>
                ) : (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-warning">
                    <TriangleAlert className="h-3 w-3" aria-hidden="true" />
                    Needs review · low confidence
                  </p>
                )}
              </div>
              <Amount value={tx.amount} className="text-[13px]" />
            </div>
            {!tx.category && (
              <div className="mt-2 flex flex-wrap gap-1.5 pl-14">
                {["Office supplies", "Shopping"].map((s) => (
                  <span key={s} className="rounded-[3px] border border-dashed border-foreground/50 px-2 py-0.5 font-mono text-[11px] text-foreground">
                    {s}?
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
        Rule saved: future “wework” charges go to Coworking.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------ */

const quarters = [
  { label: "Q1", due: "30 Apr", amount: 2370, status: "paid" as const },
  { label: "Q2", due: "31 Jul", amount: 2370, status: "paid" as const },
  { label: "Q3", due: "31 Oct", amount: 2370, status: "paid" as const },
  { label: "Q4", due: "31 Jan", amount: 2370, status: "upcoming" as const },
]

export function TaxPreview() {
  const profit = 47400
  const rate = 0.2
  const estimate = profit * rate
  const paid = quarters.filter((q) => q.status === "paid").reduce((sum, q) => sum + q.amount, 0)

  return (
    <div className="space-y-3">
      <div className="border-b border-border pb-3.5">
        <p className="font-mono text-[10.5px] tracking-[0.14em] text-muted-foreground uppercase">Estimated tax this year</p>
        <p className="mt-1 font-mono text-3xl font-medium tracking-tight tabular-nums text-foreground">{usd(estimate)}</p>
        <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
          {usd(profit)} taxable profit × {rate * 100}% illustrative rate
        </p>
        <div className="mt-3 h-2 border border-foreground/70">
          <div className="h-full bg-foreground" style={{ width: `${(paid / estimate) * 100}%` }} />
        </div>
        <p className="mt-1.5 text-[11px] text-muted-foreground tabular-nums">
          {usd(paid)} paid · {usd(estimate - paid)} to go
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {quarters.map((q) => (
          <li key={q.label} className="border-t-2 border-foreground pt-2">
            <p className="flex items-center justify-between text-[11px] text-muted-foreground">
              {q.label}
              {q.status === "paid" ? (
                <span className="inline-flex items-center gap-0.5 text-foreground">
                  <Check className="h-3 w-3 text-success" aria-hidden="true" />
                  Paid
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5">
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  Next
                </span>
              )}
            </p>
            <p className="mt-1 font-mono text-sm tabular-nums text-foreground">{usd(q.amount)}</p>
            <p className="text-[11px] text-muted-foreground">due {q.due}</p>
          </li>
        ))}
      </ul>

      <div className="flex items-start gap-2.5 border-l-2 border-foreground py-1 pl-3">
        <PenLine className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
        <p className="text-[13px] leading-relaxed text-foreground">
          Set aside <span className="font-semibold tabular-nums">{usd(480)}</span> from INV-014.{" "}
          <span className="text-muted-foreground">What if income rises 10%? Tax goes up by {usd(estimate * 0.1)}.</span>
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

const balance = [6200, 6900, 6400, 7800, 8600, 9100]
const projected = [9500, 9300, 9850]
const budgets = [
  { name: "Eating out", spent: 276, limit: 300 },
  { name: "Software", spent: 118, limit: 150 },
  { name: "Transport", spent: 64, limit: 120 },
]

export function AnalyticsPreview() {
  const all = [...balance, ...projected]
  const w = 300
  const h = 96
  const min = 5500
  const max = 10500
  const step = w / (all.length - 1)
  const pt = (v: number, i: number) => `${(i * step).toFixed(1)},${(h - ((v - min) / (max - min)) * h).toFixed(1)}`
  const actualPts = balance.map(pt).join(" ")
  const projectedPts = [balance[balance.length - 1], ...projected].map((v, i) => pt(v, i + balance.length - 1)).join(" ")
  const splitX = (balance.length - 1) * step

  return (
    <div className="space-y-3">
      <div className="border-b border-border pb-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <p className="font-mono text-[10.5px] tracking-[0.14em] text-muted-foreground uppercase">Balance, with 3-month forecast</p>
            <p className="mt-1 font-mono text-2xl font-medium tracking-tight tabular-nums text-foreground">{usd(balance[balance.length - 1])}</p>
          </div>
          <p className="text-right text-[11px] text-muted-foreground">
            In 3 months
            <span className="block font-mono text-sm tabular-nums text-foreground">{usd(projected[projected.length - 1])}</span>
          </p>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 h-auto w-full overflow-visible" aria-hidden="true">
          <rect x={splitX} y={0} width={w - splitX} height={h} className="fill-secondary" />
          <polyline points={actualPts} fill="none" strokeWidth={2} strokeLinejoin="round" className="stroke-foreground" />
          <polyline
            points={projectedPts}
            fill="none"
            strokeWidth={2}
            strokeDasharray="4 4"
            strokeLinejoin="round"
            className="stroke-foreground/60"
          />
        </svg>
        <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
          <span>Jun</span>
          <span>Today</span>
          <span>Feb</span>
        </div>
      </div>

      <ul className="space-y-2.5">
        {budgets.map((b) => {
          const pct = b.spent / b.limit
          const near = pct >= 0.9
          return (
            <li key={b.name}>
              <div className="flex items-baseline justify-between text-[13px]">
                <span className="text-foreground">{b.name}</span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {usd(b.spent)} of {usd(b.limit)}
                  {near && <span className="ml-1.5 text-warning">· {Math.round(pct * 100)}%</span>}
                </span>
              </div>
              <div className="mt-1 h-2 border border-foreground/60">
                <div
                  className={cn("h-full", near ? "bg-warning" : "bg-foreground")}
                  style={{ width: `${pct * 100}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* ------------------------------------------------------------------ */

const invoices = [
  { number: "INV-014", client: "Northwind Studio", amount: 2400, status: "paid" as const, note: "Paid today" },
  { number: "INV-015", client: "Lumen Labs", amount: 1850, status: "sent" as const, note: "Due in 6 days" },
  { number: "INV-012", client: "Harbor & Co", amount: 3200, status: "overdue" as const, note: "34 days late" },
  { number: "INV-016", client: "Fieldnote", amount: 900, status: "draft" as const, note: "Not sent yet" },
]

const statusStyle = {
  paid: { label: "Paid", icon: Check, className: "border-success text-success", iconClass: "" },
  sent: { label: "Sent", icon: Send, className: "border-foreground text-foreground", iconClass: "" },
  overdue: {
    label: "Overdue",
    icon: CircleAlert,
    className: "border-destructive text-destructive",
    iconClass: "",
  },
  draft: { label: "Draft", icon: PenLine, className: "border-dashed border-muted-foreground text-muted-foreground", iconClass: "" },
}

export function InvoicesPreview() {
  return (
    <div className="space-y-3">
      <ul className="divide-y divide-border border-y border-foreground/70">
        {invoices.map((inv) => {
          const s = statusStyle[inv.status]
          return (
            <li key={inv.number} className="flex items-center gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-foreground">
                  {inv.client}
                  <span className="ml-2 font-mono text-[11px] font-normal text-muted-foreground">{inv.number}</span>
                </p>
                <p className="text-[11px] text-muted-foreground">{inv.note}</p>
              </div>
              <span
                className={cn("inline-flex shrink-0 -rotate-2 items-center gap-1 rounded-[2px] border-[1.5px] px-1.5 py-0.5 font-mono text-[10.5px] font-medium tracking-[0.1em] uppercase", s.className)}
              >
                <s.icon className={cn("h-3 w-3", s.iconClass)} aria-hidden="true" />
                {s.label}
              </span>
              <span className="w-16 shrink-0 text-right font-mono text-[13px] tabular-nums text-foreground">{usd(inv.amount)}</span>
            </li>
          )
        })}
      </ul>

      <div className="flex items-center gap-2.5 rounded-[3px] bg-primary px-3 py-2.5 text-primary-foreground">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center bg-lime text-ink">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <p className="text-[13px]">
          INV-014 marked paid · <span className="font-mono tabular-nums">+$2,400</span> added to income
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

const components = [
  { name: "Savings rate", score: 80 },
  { name: "Emergency buffer", score: 35 },
  { name: "Tax readiness", score: 55 },
]

export function InsightsPreview() {
  const score = 68
  const r = 26
  const c = 2 * Math.PI * r

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 border-b border-border pb-3.5">
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90" aria-hidden="true">
            <circle cx="32" cy="32" r={r} fill="none" strokeWidth={6} className="stroke-secondary" />
            <circle
              cx="32"
              cy="32"
              r={r}
              fill="none"
              strokeWidth={6}
              strokeLinecap="butt"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - score / 100)}
              className="stroke-foreground"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-mono text-base font-medium tabular-nums text-foreground">
            {score}
          </span>
        </div>
        <ul className="min-w-0 flex-1 space-y-1.5">
          {components.map((comp) => (
            <li key={comp.name} className="grid grid-cols-[1fr_72px] items-center gap-2 text-[11px] text-muted-foreground">
              {comp.name}
              <span className="h-2 border border-foreground/60">
                <span className="block h-full bg-foreground/80" style={{ width: `${comp.score}%` }} />
              </span>
            </li>
          ))}
        </ul>
      </div>

      <ul className="space-y-2">
        <li className="border-l-2 border-warning py-1 pl-3">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
            <TriangleAlert className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
            Tax set-aside is $1,580 short
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            You set aside 14% of income; your illustrative rate is 20%.
          </p>
          <p className="mt-2 inline-flex items-center gap-1 font-mono text-[10.5px] font-medium tracking-[0.1em] text-foreground uppercase">
            Review tax set-aside <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </p>
        </li>
        <li className="ruled flex items-center gap-2.5 rounded-[3px] border border-foreground/60 bg-card p-3 [--rule:1.25rem]">
          <GraduationCap className="h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
          <p className="text-[13px] text-foreground">
            2-min lesson: <span className="font-medium">Set aside tax as you earn</span>
          </p>
        </li>
      </ul>

      <div className="flex items-center gap-2 rounded-[3px] border border-foreground/70 bg-background px-2.5 py-2 text-[12px]">
        <span className="font-mono text-foreground">coffee 4.50 yesterday</span>
        <ArrowRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
        <span className="text-muted-foreground">Eating out</span>
        <span className="ml-auto font-mono tabular-nums text-foreground">{"−"}$4.50</span>
      </div>
    </div>
  )
}
