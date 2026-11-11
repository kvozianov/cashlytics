import { cn } from '@/lib/utils'

export interface Segment {
  key: string
  label: string
  value: number
  color: string
}

export interface SegmentBarProps {
  segments: Segment[]
  /** Accessible name; the parts and shares are appended. */
  label: string
  /** Height class, default `h-2.5`. */
  heightClassName?: string
  format?: (n: number) => string
  className?: string
}

/** One whole split into parts, with a 2px paper gap between them. */
export function SegmentBar({ segments, label, heightClassName = 'h-2.5', format, className }: SegmentBarProps) {
  const parts = segments.filter((s) => s.value > 0)
  const sum = parts.reduce((s, p) => s + p.value, 0) || 1
  const described = `${label}: ${parts.map((p) => `${p.label} ${Math.round((p.value / sum) * 100)}%${format ? ` (${format(p.value)})` : ''}`).join(', ')}`
  return (
    <div role="img" aria-label={described} className={cn('flex w-full gap-0.5 overflow-hidden', heightClassName, className)}>
      {parts.map((p) => (
        <span
          key={p.key}
          title={`${p.label}: ${Math.round((p.value / sum) * 100)}%${format ? ` · ${format(p.value)}` : ''}`}
          className="h-full first:rounded-l-[2px] last:rounded-r-[2px] transition-[flex-grow] duration-300 ease-out motion-reduce:transition-none"
          style={{ flexGrow: p.value, flexBasis: 0, backgroundColor: p.color }}
        />
      ))}
    </div>
  )
}
