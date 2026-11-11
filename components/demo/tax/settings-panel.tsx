'use client'

import { useId, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { accountBalances } from '@/lib/demo/analytics'
import { money } from '@/lib/demo/format'
import { useDemo } from '@/lib/demo/store'
import type { TaxBracket, TaxSettings } from '@/lib/demo/types'

import { Slider } from '@/components/ui/slider'

const DEFAULT_BRACKETS: TaxBracket[] = [
  { upTo: 12_000, rate: 0.1 },
  { upTo: 50_000, rate: 0.2 },
  { upTo: null, rate: 0.3 },
]

interface SettingsPanelProps {
  settings: TaxSettings
  /** Live preview while dragging. */
  onDraft: (patch: Partial<TaxSettings>) => void
  onCommit: (patch: Partial<TaxSettings>) => void
}

const parse = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(/[,$\s%]/g, '')))

export function SettingsPanel({ settings, onDraft, onCommit }: SettingsPanelProps) {
  const uid = useId()
  const { state, today, actions } = useDemo()
  const bracketed = !!settings.brackets?.length
  const reserve = state.accounts.find((a) => a.purpose === 'tax')
  const reserveBalance = reserve ? (accountBalances(state, today).find((b) => b.account.id === reserve.id)?.balance ?? 0) : 0

  const [rateText, setRateText] = useState(String(Math.round(settings.rate * 1000) / 10))
  const [allowanceText, setAllowanceText] = useState(String(settings.allowance ?? 0))
  // Keep the text boxes in step when the value changes elsewhere (the slider, a reset).
  const [seen, setSeen] = useState({ rate: settings.rate, allowance: settings.allowance })
  if (seen.rate !== settings.rate || seen.allowance !== settings.allowance) {
    setSeen({ rate: settings.rate, allowance: settings.allowance })
    setRateText(String(Math.round(settings.rate * 1000) / 10))
    setAllowanceText(String(settings.allowance ?? 0))
  }

  const rateValue = parse(rateText)
  const rateError = Number.isFinite(rateValue) && rateValue >= 0 && rateValue <= 60 ? '' : 'Enter a rate from 0 to 60%.'
  const allowanceValue = parse(allowanceText)
  const allowanceError = Number.isFinite(allowanceValue) && allowanceValue >= 0 && allowanceValue <= 1_000_000 ? '' : 'Enter an amount, 0 or more.'

  const commitRate = () => {
    if (!rateError && Math.abs(rateValue / 100 - settings.rate) > 1e-9) onCommit({ rate: rateValue / 100 })
  }
  const commitAllowance = () => {
    if (!allowanceError && allowanceValue !== (settings.allowance ?? 0)) onCommit({ allowance: allowanceValue })
  }

  return (
    <section aria-labelledby={`${uid}-title`} className="rounded-md border border-border bg-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-4 py-3 sm:px-6">
        <h2 id={`${uid}-title`} className="text-sm font-semibold tracking-tight">
          Settings
        </h2>
        <p className="text-[12.5px] text-muted-foreground">Method: profit-based (taxable income minus deductible costs)</p>
      </div>
      <div className="grid gap-x-8 gap-y-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor={`${uid}-brackets`}>Progressive brackets</Label>
              <p id={`${uid}-brackets-hint`} className="text-[12.5px] text-muted-foreground">
                Higher slices of profit pay a higher rate. Off = one flat rate.
              </p>
            </div>
            <Switch
              id={`${uid}-brackets`}
              aria-describedby={`${uid}-brackets-hint`}
              checked={bracketed}
              onCheckedChange={(on) => onCommit({ brackets: on ? DEFAULT_BRACKETS : undefined })}
            />
          </div>

          {!bracketed ? (
            <div className="space-y-3">
              <div className="flex items-end justify-between gap-4">
                <Label htmlFor={`${uid}-rate`}>Flat rate</Label>
                <div className="flex items-center gap-1.5">
                  <Input
                    id={`${uid}-rate`}
                    inputMode="decimal"
                    value={rateText}
                    onChange={(e) => setRateText(e.target.value)}
                    onBlur={commitRate}
                    onKeyDown={(e) => e.key === 'Enter' && commitRate()}
                    aria-invalid={!!rateError}
                    aria-describedby={`${uid}-rate-err`}
                    className="h-8 w-20 text-right font-mono"
                  />
                  <span className="font-mono text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <Slider
                aria-label="Flat tax rate"
                aria-valuetext={`${Math.round(settings.rate * 100)} percent`}
                min={0}
                max={50}
                step={1}
                value={[Math.round(settings.rate * 100)]}
                onValueChange={([v]) => onDraft({ rate: v / 100 })}
                onValueCommit={([v]) => onCommit({ rate: v / 100 })}
              />
              <div className="flex justify-between font-mono text-[11px] text-muted-foreground tabular-nums" aria-hidden="true">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
              <p id={`${uid}-rate-err`} className="text-[12px] text-destructive">
                {rateError}
              </p>
            </div>
          ) : (
            <BracketEditor brackets={settings.brackets!} onCommit={(brackets) => onCommit({ brackets })} />
          )}
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor={`${uid}-allow`}>Tax-free allowance</Label>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm text-muted-foreground">$</span>
              <Input
                id={`${uid}-allow`}
                inputMode="decimal"
                value={allowanceText}
                onChange={(e) => setAllowanceText(e.target.value)}
                onBlur={commitAllowance}
                onKeyDown={(e) => e.key === 'Enter' && commitAllowance()}
                aria-invalid={!!allowanceError}
                aria-describedby={`${uid}-allow-hint`}
                className="h-8 w-32 text-right font-mono"
              />
            </div>
            <p id={`${uid}-allow-hint`} className={allowanceError ? 'text-[12px] text-destructive' : 'text-[12px] text-muted-foreground'}>
              {allowanceError || 'Profit below this pays no tax. 0 if you are not sure.'}
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Set-aside account</p>
            {reserve ? (
              <p className="flex items-baseline gap-2 text-[13px]">
                <span>
                  {reserve.name} ··{reserve.last4}
                </span>
                <span aria-hidden="true" className="ldr-leader" />
                <span className="font-mono tabular-nums">{money(reserveBalance)}</span>
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-[12.5px] text-muted-foreground">No separate account yet, so nothing counts as set aside.</p>
                <Button size="sm" variant="outline" onClick={() => actions.openTaxReserve()}>
                  Open a tax reserve
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function BracketEditor({ brackets, onCommit }: { brackets: TaxBracket[]; onCommit: (b: TaxBracket[]) => void }) {
  const uid = useId()
  const toRows = (b: TaxBracket[]) => b.map((x) => ({ upTo: x.upTo === null ? '' : String(x.upTo), rate: String(Math.round(x.rate * 1000) / 10) }))
  const [rows, setRows] = useState(() => toRows(brackets))
  const [seen, setSeen] = useState(brackets)
  if (seen !== brackets) {
    setSeen(brackets)
    setRows(toRows(brackets))
  }

  const parsed = rows.map((r, i) => ({ upTo: i === rows.length - 1 ? null : parse(r.upTo), rate: parse(r.rate) / 100 }))
  const errors = parsed.map((b, i) => {
    if (!Number.isFinite(b.rate) || b.rate < 0 || b.rate > 0.6) return 'Rate 0–60%'
    if (b.upTo !== null) {
      if (!Number.isFinite(b.upTo) || b.upTo <= 0) return 'Enter an upper limit'
      const prev = i > 0 ? parsed[i - 1].upTo : 0
      if (prev !== null && b.upTo <= prev) return 'Must be above the band before'
    }
    return ''
  })
  const commit = () => {
    if (errors.some(Boolean)) return
    onCommit(parsed.map((b) => ({ upTo: b.upTo, rate: Math.round(b.rate * 1000) / 1000 })))
  }

  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm font-medium">Brackets</legend>
      <ol className="space-y-2">
        {rows.map((r, i) => {
          const last = i === rows.length - 1
          const lower = i === 0 ? 0 : parse(rows[i - 1].upTo)
          return (
            <li key={i} className="grid grid-cols-[minmax(0,1fr)_5.5rem] items-center gap-3">
              <div className="flex items-center gap-2 font-mono text-[13px] tabular-nums">
                <span className="text-muted-foreground">{money(Number.isFinite(lower) ? lower : 0, { whole: true })} –</span>
                {last ? (
                  <span>and above</span>
                ) : (
                  <>
                    <Label htmlFor={`${uid}-u${i}`} className="sr-only">
                      Band {i + 1} upper limit, dollars
                    </Label>
                    <Input
                      id={`${uid}-u${i}`}
                      inputMode="numeric"
                      value={r.upTo}
                      onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, upTo: e.target.value } : x)))}
                      onBlur={commit}
                      onKeyDown={(e) => e.key === 'Enter' && commit()}
                      aria-invalid={!!errors[i] && errors[i] !== 'Rate 0–60%'}
                      aria-describedby={`${uid}-e${i}`}
                      className="h-8 w-28 text-right font-mono"
                    />
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Label htmlFor={`${uid}-r${i}`} className="sr-only">
                  Band {i + 1} rate, percent
                </Label>
                <Input
                  id={`${uid}-r${i}`}
                  inputMode="decimal"
                  value={r.rate}
                  onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, rate: e.target.value } : x)))}
                  onBlur={commit}
                  onKeyDown={(e) => e.key === 'Enter' && commit()}
                  aria-invalid={errors[i] === 'Rate 0–60%'}
                  aria-describedby={`${uid}-e${i}`}
                  className="h-8 w-16 text-right font-mono"
                />
                <span className="font-mono text-sm text-muted-foreground">%</span>
              </div>
              <p id={`${uid}-e${i}`} className="col-span-2 -mt-1 text-[12px] text-destructive empty:hidden">
                {errors[i]}
              </p>
            </li>
          )
        })}
      </ol>
    </fieldset>
  )
}
