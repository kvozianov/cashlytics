import { money, moneyCompact, signedMoney } from '@/lib/demo/format'
import { cn } from '@/lib/utils'

export interface MoneyProps {
  value: number
  /** Show `+` / `−`. Default: true when `tone` is `auto`. */
  signed?: boolean
  /** Drop cents. */
  whole?: boolean
  /** `$12k` style. */
  compact?: boolean
  /** `auto`: money in is green with `+`, money out is plain ink with `−`. `plain`: no colour. */
  tone?: 'auto' | 'plain'
  className?: string
}

/** A formatted USD amount in mono tabular figures, coloured by direction. */
export function Money({ value, signed, whole = false, compact = false, tone = 'auto', className }: MoneyProps) {
  const showSign = signed ?? tone === 'auto'
  const text = compact ? (value > 0 && showSign ? `+${moneyCompact(value)}` : moneyCompact(value)) : showSign ? signedMoney(value, { whole }) : money(value, { whole })
  return (
    <span className={cn('font-mono tabular-nums whitespace-nowrap', tone === 'auto' && value > 0 && 'text-success', className)}>
      {text}
    </span>
  )
}
