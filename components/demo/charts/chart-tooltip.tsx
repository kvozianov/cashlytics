import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** Mono tick labels for recharts axes. */
export const axisTick = { fontFamily: 'var(--font-dm-mono), ui-monospace, monospace', fontSize: 11, fill: 'var(--muted-foreground)' } as const

/** Hairline grid for recharts `CartesianGrid`. */
export const gridProps = { stroke: 'var(--border)', strokeDasharray: undefined, vertical: false } as const

export interface TooltipRow {
  label: ReactNode
  value: ReactNode
  /** Swatch colour; omit for a plain row. */
  color?: string
  /** Line swatch instead of a square. */
  line?: boolean
}

/** The themed tooltip / readout card: a title and ledger rows. Usable standalone or inside a recharts `Tooltip`. */
export function ChartTooltipCard({ title, rows, footer, className }: { title?: ReactNode; rows: TooltipRow[]; footer?: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-[11rem] rounded-sm border border-border-strong/80 bg-popover px-3 py-2 text-xs text-popover-foreground shadow-[3px_3px_0_0_var(--border)]', className)}>
      {title && <p className="mb-1.5 font-mono text-[11px] tracking-wider text-muted-foreground uppercase">{title}</p>}
      <dl className="space-y-1">
        {rows.map((r, i) => (
          <div key={i} className="flex items-baseline gap-2">
            {r.color && (
              <span
                aria-hidden="true"
                className={cn('shrink-0 self-center', r.line ? 'h-0.5 w-3' : 'size-2 rounded-[2px]')}
                style={{ backgroundColor: r.color }}
              />
            )}
            <dt className="text-muted-foreground">{r.label}</dt>
            <span aria-hidden="true" className="min-w-3 flex-1 self-end border-b border-dotted border-current opacity-30" />
            <dd className="font-mono tabular-nums">{r.value}</dd>
          </div>
        ))}
      </dl>
      {footer && <p className="mt-1.5 border-t border-border pt-1.5 text-[11px] text-muted-foreground">{footer}</p>}
    </div>
  )
}

interface RechartsPayloadItem {
  dataKey?: string | number
  name?: string | number
  value?: number | string | (number | string)[]
  color?: string
  payload?: Record<string, unknown>
}

export interface MoneyTooltipProps {
  active?: boolean
  payload?: RechartsPayloadItem[]
  label?: string | number
  /** Label and colour per dataKey; keys not listed are skipped. */
  series: Record<string, { label: string; color: string; line?: boolean }>
  format: (n: number) => string
  labelFormatter?: (label: string | number | undefined, payload: Record<string, unknown> | undefined) => ReactNode
  footer?: ReactNode
}

/** Pass as `<Tooltip content={<MoneyTooltip series={…} format={money} />} />`. */
export function MoneyTooltip({ active, payload, label, series, format, labelFormatter, footer }: MoneyTooltipProps) {
  if (!active || !payload?.length) return null
  const rows: TooltipRow[] = payload
    .filter((p) => p.dataKey !== undefined && series[String(p.dataKey)] && typeof p.value === 'number')
    .map((p) => {
      const s = series[String(p.dataKey)]
      return { label: s.label, value: format(p.value as number), color: s.color, line: s.line }
    })
  if (!rows.length) return null
  return <ChartTooltipCard title={labelFormatter ? labelFormatter(label, payload[0]?.payload) : label} rows={rows} footer={footer} />
}

/** A screen-reader summary for a chart. */
export function ChartSummary({ children }: { children: ReactNode }) {
  return <p className="sr-only">{children}</p>
}

/** A row of legend keys: square for bars, short line for lines. */
export function ChartLegendKeys({ items, className }: { items: { label: string; color: string; line?: boolean; dashed?: boolean }[]; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground', className)}>
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={cn('shrink-0', i.line ? 'h-0 w-4 border-t-2' : 'size-2.5 rounded-[2px]', i.dashed && 'border-dashed')}
            style={i.line ? { borderColor: i.color } : { backgroundColor: i.color }}
          />
          {i.label}
        </li>
      ))}
    </ul>
  )
}
