import Link from "next/link"
import {
  ArrowLeftRight,
  Calculator,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Lightbulb,
  Target,
  TriangleAlert,
} from "lucide-react"
import { LogoMark } from "@/components/logo"
import { cn } from "@/lib/utils"

// Illustrative numbers for the landing-page preview only. The live demo
// generates its own data; nothing here is shared with it.
const months = [
  { label: "Jun", income: 6200, expenses: 4100 },
  { label: "Jul", income: 4800, expenses: 3900 },
  { label: "Aug", income: 7400, expenses: 4600 },
  { label: "Sep", income: 5100, expenses: 4200 },
  { label: "Oct", income: 8300, expenses: 4500 },
  { label: "Nov", income: 6900, expenses: 4300 },
]

const totalIncome = months.reduce((sum, m) => sum + m.income, 0)
const totalExpenses = months.reduce((sum, m) => sum + m.expenses, 0)
const totalNet = totalIncome - totalExpenses

const kpis = [
  { label: "Income", value: usd(totalIncome), note: `avg ${usd(totalIncome / months.length)}/mo` },
  { label: "Expenses", value: usd(totalExpenses), note: `avg ${usd(totalExpenses / months.length)}/mo` },
  { label: "Net", value: usd(totalNet), note: "after all costs", positive: true },
  { label: "Savings rate", value: `${Math.round((totalNet / totalIncome) * 100)}%`, note: "target 30%" },
]

const transactions = [
  {
    description: "NORTHWIND STUDIO · INV-014",
    category: "Client income",
    detail: "Invoice marked paid",
    amount: 2400,
    when: "Today",
  },
  {
    description: "ADOBE *CREATIVE CLOUD",
    category: "Software",
    detail: "Matched “adobe” · deductible",
    amount: -59.99,
    when: "Yesterday",
  },
  {
    description: "SQ *BLUE BOTTLE 0423",
    category: "Eating out",
    detail: "Matched “blue bottle”",
    amount: -5.4,
    when: "Yesterday",
  },
  {
    description: "AMZN MKTP US*2K4L1",
    category: "Needs review",
    detail: "Low confidence · 2 suggestions",
    amount: -84.12,
    when: "2 days ago",
    review: true,
  },
]

const sidebar = [
  { label: "Overview", icon: LayoutDashboard, active: true },
  { label: "Transactions", icon: ArrowLeftRight },
  { label: "Invoices", icon: FileText },
  { label: "Tax", icon: Calculator },
  { label: "Plan", icon: Target },
  { label: "Insights", icon: Lightbulb },
  { label: "Learn", icon: GraduationCap },
]

const tax = { estimate: 2620, setAside: 2180 }
const taxShare = tax.setAside / tax.estimate

function usd(value: number, decimals = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

function signed(value: number) {
  const formatted = usd(Math.abs(value), 2)
  return value >= 0 ? `+${formatted}` : `−${formatted}`
}

export function DashboardPreview() {
  return (
    <Link
      href="/demo"
      aria-label="Open the live demo. Preview of the overview dashboard with illustrative data."
      className="group relative isolate block rounded-md focus-visible:outline-offset-4"
    >
      <div className="overflow-hidden rounded-md border border-foreground/80 bg-card text-left shadow-[6px_6px_0_0_var(--foreground)] transition-[translate,box-shadow] duration-200 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:shadow-[9px_9px_0_0_var(--lime)] motion-reduce:transition-none">
        {/* Window bar */}
        <div className="flex h-9 items-center gap-3 border-b border-foreground/80 px-4 font-mono text-[11px] tracking-[0.12em] uppercase">
          <span className="truncate text-muted-foreground">
            cashlytics <span aria-hidden="true">/</span> demo <span aria-hidden="true">/</span>{" "}
            <span className="text-foreground">overview</span>
          </span>
          <span className="ml-auto hidden rounded-[2px] border-[1.5px] border-stamp px-1.5 py-px text-[10px] text-stamp sm:inline">
            Fictional data
          </span>
        </div>

        <div className="grid md:grid-cols-[176px_1fr]">
          {/* Sidebar hint */}
          <div className="hidden flex-col gap-4 border-r border-border bg-secondary/40 p-3 md:flex">
            <div className="flex items-center gap-2 px-1.5 pt-1">
              <LogoMark className="h-6 w-6" />
              <span className="font-display text-sm font-bold tracking-tight text-foreground">Cashlytics</span>
            </div>
            <ul className="space-y-0.5">
              {sidebar.map((item) => (
                <li
                  key={item.label}
                  className={cn(
                    "flex items-center gap-2 rounded-[3px] px-2 py-1.5 text-[13px]",
                    item.active ? "bg-lime font-medium text-ink" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </li>
              ))}
            </ul>
            <div className="mt-auto rounded-[3px] border border-border bg-card p-2.5">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">Health</span>
                <span className="font-mono text-sm font-medium tabular-nums text-foreground">68</span>
              </div>
              <div className="mt-1.5 h-1.5 border border-foreground/70">
                <div className="h-full w-[68%] bg-foreground" />
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-display text-lg font-bold tracking-tight text-foreground">Overview</p>
                <p className="text-[13px] text-muted-foreground">Maya Chen · freelance product designer</p>
              </div>
              <span className="rounded-[3px] border border-border px-2 py-1 font-mono text-[11px] text-muted-foreground">Last 6 months</span>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {kpis.map((kpi, i) => (
                <div
                  key={kpi.label}
                  className="border-t border-foreground/80 pt-2.5 pb-1 animate-in fade-in slide-in-from-bottom-1 fill-mode-both duration-300 motion-reduce:animate-none"
                  style={{ animationDelay: `${150 + i * 60}ms` }}
                >
                  <p className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">{kpi.label}</p>
                  <p
                    className={cn(
                      "mt-1 font-mono text-lg font-medium tracking-tight tabular-nums sm:text-xl",
                      kpi.positive ? "text-success" : "text-foreground",
                    )}
                  >
                    {kpi.positive ? "+" : ""}
                    {kpi.value}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">{kpi.note}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <div className="rounded-[3px] border border-border p-3 lg:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">Cash flow</p>
                  <ul className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <li className="flex items-center gap-1.5">
                      <span className="h-2 w-2 bg-foreground" />
                      Income
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-2 w-2 bg-muted-foreground/35" />
                      Expenses
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="h-0.5 w-3 bg-success" />
                      Net
                    </li>
                  </ul>
                </div>
                <CashFlowChart />
              </div>

              <TaxRing />
            </div>

            {/* Transactions */}
            <div className="rounded-[3px] border border-border">
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <p className="text-sm font-medium text-foreground">Recent transactions</p>
                <span className="text-[11px] text-muted-foreground">Sorted automatically</span>
              </div>
              <ul className="divide-y divide-border">
                {transactions.map((tx, i) => (
                  <li
                    key={tx.description}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 animate-in fade-in fill-mode-both duration-300 motion-reduce:animate-none",
                      i > 2 && "hidden sm:flex",
                    )}
                    style={{ animationDelay: `${500 + i * 70}ms` }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[12px] text-foreground">{tx.description}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {tx.when} · {tx.detail}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "hidden shrink-0 rounded-[2px] border px-1.5 py-0.5 text-[11px] sm:inline-flex sm:items-center sm:gap-1",
                        tx.review
                          ? "border-warning/40 text-warning"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {tx.review && <TriangleAlert className="h-3 w-3" />}
                      {tx.category}
                    </span>
                    <span
                      className={cn(
                        "w-20 shrink-0 text-right font-mono text-[12px] tabular-nums",
                        tx.amount > 0 ? "text-success" : "text-foreground",
                      )}
                    >
                      {signed(tx.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <p className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground uppercase">Illustrative data. The live demo generates its own.</p>
          </div>
        </div>
      </div>

    </Link>
  )
}

// Chart geometry, in viewBox units. The overlay labels use the same numbers as
// percentages, which works because the SVG keeps its aspect ratio.
const W = 520
const H = 180
const TOP = 14
const BOTTOM = 172
const MAX = 9000
const ticks = [0, 3000, 6000, 9000]
const groupWidth = W / months.length
const barWidth = 16
const barGap = 3

function y(value: number) {
  return BOTTOM - (value / MAX) * (BOTTOM - TOP)
}

function roundedTopBar(x: number, top: number, width: number, height: number, radius = 1.5) {
  const r = Math.min(radius, height, width / 2)
  const bottom = top + height
  return `M${x},${bottom}V${top + r}Q${x},${top} ${x + r},${top}H${x + width - r}Q${x + width},${top} ${x + width},${top + r}V${bottom}Z`
}

function CashFlowChart() {
  const netPoints = months.map((m, i) => ({
    x: groupWidth * i + groupWidth / 2,
    y: y(m.income - m.expenses),
  }))

  return (
    <div className="mt-3">
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="cl-chart block h-auto w-full overflow-visible"
          role="img"
          aria-label={`Monthly income, expenses and net from ${months[0].label} to ${months[months.length - 1].label}. Net was positive every month.`}
        >
          <style>{chartCss}</style>
          {ticks.map((t) => (
            <line
              key={t}
              x1={0}
              x2={W}
              y1={y(t)}
              y2={y(t)}
              className={t === 0 ? "stroke-border" : "stroke-border/60"}
              strokeDasharray={t === 0 ? undefined : "2 4"}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {months.map((m, i) => {
            const pairStart = groupWidth * i + (groupWidth - (barWidth * 2 + barGap)) / 2
            return (
              <g key={m.label}>
                <title>
                  {`${m.label}: income ${usd(m.income)}, expenses ${usd(m.expenses)}, net ${usd(m.income - m.expenses)}`}
                </title>
                <rect x={groupWidth * i} y={TOP} width={groupWidth} height={BOTTOM - TOP} fill="transparent" />
                <path
                  d={roundedTopBar(pairStart, y(m.income), barWidth, BOTTOM - y(m.income))}
                  className="cl-bar fill-foreground"
                  style={{ animationDelay: `${200 + i * 50}ms` }}
                />
                <path
                  d={roundedTopBar(pairStart + barWidth + barGap, y(m.expenses), barWidth, BOTTOM - y(m.expenses))}
                  className="cl-bar fill-muted-foreground/35"
                  style={{ animationDelay: `${230 + i * 50}ms` }}
                />
              </g>
            )
          })}

          <polyline
            points={netPoints.map((p) => `${p.x},${p.y}`).join(" ")}
            pathLength={1}
            fill="none"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="cl-line stroke-success"
          />
          {netPoints.map((p, i) => (
            <circle
              key={months[i].label}
              cx={p.x}
              cy={p.y}
              r={4}
              strokeWidth={2}
              className="cl-dot fill-success stroke-card"
              style={{ animationDelay: `${700 + i * 60}ms` }}
            />
          ))}
        </svg>

        {/* Overlay labels stay readable at any width */}
        {ticks.slice(1).map((t) => (
          <span
            key={t}
            aria-hidden="true"
            className="absolute left-0 -translate-y-full pb-0.5 text-[10px] leading-none text-muted-foreground tabular-nums"
            style={{ top: `${(y(t) / H) * 100}%` }}
          >
            ${t / 1000}k
          </span>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-6 text-center text-[11px] text-muted-foreground" aria-hidden="true">
        {months.map((m) => (
          <span key={m.label}>{m.label}</span>
        ))}
      </div>
    </div>
  )
}

function TaxRing() {
  const radius = 30
  const circumference = 2 * Math.PI * radius
  const shortfall = tax.estimate - tax.setAside

  return (
    <div className="flex flex-col rounded-[3px] border border-border p-3">
      <p className="text-sm font-medium text-foreground">Tax set-aside</p>
      <p className="text-[11px] text-muted-foreground">This quarter · 20% rate</p>
      <div className="mt-3 flex items-center gap-4 lg:flex-col lg:items-start xl:flex-row xl:items-center">
        <div className="relative h-20 w-20 shrink-0">
          <svg viewBox="0 0 80 80" className="cl-chart h-20 w-20 -rotate-90" aria-hidden="true">
            <circle cx="40" cy="40" r={radius} fill="none" strokeWidth={7} className="stroke-secondary" />
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - taxShare)}
              className="cl-ring stroke-foreground"
              style={{ ["--cl-ring-from" as string]: `${circumference}` }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-mono text-sm font-medium tabular-nums text-foreground">
            {Math.round(taxShare * 100)}%
          </span>
        </div>
        <div className="min-w-0 space-y-1">
          <p className="font-mono text-lg font-medium tracking-tight tabular-nums text-foreground">{usd(tax.setAside)}</p>
          <p className="text-[11px] text-muted-foreground tabular-nums">of {usd(tax.estimate)} estimated</p>
        </div>
      </div>
      <p className="mt-auto flex items-center gap-1.5 pt-3 text-[11px] text-warning">
        <TriangleAlert className="h-3 w-3 shrink-0" />
        <span className="tabular-nums">{usd(shortfall)} short of the estimate</span>
      </p>
    </div>
  )
}

const chartCss = `
@keyframes cl-grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes cl-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes cl-pop { from { opacity: 0; } to { opacity: 1; } }
@keyframes cl-ring { from { stroke-dashoffset: var(--cl-ring-from); } }
.cl-chart .cl-bar { transform-box: fill-box; transform-origin: 50% 100%; animation: cl-grow 450ms cubic-bezier(.2,.7,.2,1) both; }
.cl-chart .cl-line { stroke-dasharray: 1; animation: cl-draw 700ms 450ms ease-out both; }
.cl-chart .cl-dot { animation: cl-pop 200ms ease-out both; }
.cl-chart .cl-ring { animation: cl-ring 800ms 300ms cubic-bezier(.2,.7,.2,1) both; }
@media (prefers-reduced-motion: reduce) {
  .cl-chart .cl-bar, .cl-chart .cl-line, .cl-chart .cl-dot, .cl-chart .cl-ring { animation: none; }
}
`
