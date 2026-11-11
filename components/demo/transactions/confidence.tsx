import { REVIEW_THRESHOLD } from '@/lib/demo/categorize'
import { cn } from '@/lib/utils'

const STEPS = [0.25, 0.5, 0.7, 0.9]

/** Four ticks plus the figure; below the review threshold it turns amber and says so. */
export function ConfidenceMeter({
  value,
  showValue = true,
  className,
}: {
  value: number
  showValue?: boolean
  className?: string
}) {
  const low = value < REVIEW_THRESHOLD
  const percent = Math.round(value * 100)
  return (
    <span
      className={cn('inline-flex items-center gap-1.5 font-mono text-[11px] tabular-nums', low ? 'text-warning' : 'text-muted-foreground', className)}
      title={`Confidence ${percent}%${low ? ', below the review threshold' : ''}`}
    >
      <span aria-hidden="true" className="flex h-3 items-end gap-[2px]">
        {STEPS.map((step, i) => (
          <span
            key={step}
            className={cn('w-[3px] rounded-[1px]', value >= step ? 'bg-current' : 'bg-current/20')}
            style={{ height: `${40 + i * 20}%` }}
          />
        ))}
      </span>
      {showValue ? <span>{percent}%</span> : <span className="sr-only">Confidence {percent}%</span>}
    </span>
  )
}
