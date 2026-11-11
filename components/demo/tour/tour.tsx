'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { useReducedMotionSafe } from '@/components/motion/use-reduced-motion-safe'
import { Button } from '@/components/ui/button'
import { useInvoices } from '@/lib/demo/hooks'
import { cn } from '@/lib/utils'

import { caption, FALLBACK_TARGET, TOUR_STEPS } from './steps'
import { markTourSeen, useTourSeen } from './tour-storage'

interface TourContextValue {
  active: boolean
  start: () => void
}

const TourContext = createContext<TourContextValue>({ active: false, start: () => {} })

/** Start the guided tour from anywhere inside the demo shell. */
export function useTour(): TourContextValue {
  return useContext(TourContext)
}

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

const PAD = 6

function visible(el: Element): boolean {
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0
}

function findTarget(selectors: string[], allowFallback: boolean): HTMLElement | null {
  for (const s of selectors) {
    const el = Array.from(document.querySelectorAll<HTMLElement>(s)).find(visible)
    if (el) return el
  }
  return allowFallback ? document.querySelector<HTMLElement>(FALLBACK_TARGET) : null
}

const GAP = 12
const EDGE = 16
/** Clears the sticky demo header. */
const TOP = 72

function overlaps(a: Rect, b: Rect): boolean {
  return a.left < b.left + b.width && b.left < a.left + a.width && a.top < b.top + b.height && b.top < a.top + a.height
}

/**
 * Where the caption card goes on wide screens: beside or under the spotlight, never over it or over
 * anything the page marks with data-tour-avoid (the key figures). null keeps it in the corner.
 */
function placeCard(spot: Rect, card: { width: number; height: number }, target: HTMLElement): { top: number; left: number } | null {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const avoid = Array.from(document.querySelectorAll<HTMLElement>('[data-tour-avoid]'))
    .filter((el) => !el.contains(target) && !target.contains(el) && visible(el))
    .map((el) => {
      const r = el.getBoundingClientRect()
      return { top: r.top, left: r.left, width: r.width, height: r.height }
    })
  const clampX = (x: number) => Math.min(Math.max(EDGE, x), vw - card.width - EDGE)
  const clampY = (y: number) => Math.min(Math.max(TOP, y), vh - card.height - EDGE)
  const below = spot.top + spot.height + GAP
  const candidates = [
    { top: below, left: clampX(spot.left) },
    { top: clampY(spot.top), left: spot.left + spot.width + GAP },
    { top: spot.top - GAP - card.height, left: clampX(spot.left) },
    { top: clampY(spot.top), left: spot.left - GAP - card.width },
    // Under whatever is in the way below the spotlight.
    ...avoid.filter((a) => a.top >= spot.top).map((a) => ({ top: a.top + a.height + GAP, left: clampX(spot.left) })),
    { top: vh - card.height - 24, left: vw - card.width - 24 },
  ]
  for (const c of candidates) {
    const box = { ...c, width: card.width, height: card.height }
    const fits = c.left >= EDGE && c.left + card.width <= vw - EDGE && c.top >= TOP && c.top + card.height <= vh - EDGE
    if (fits && !overlaps(box, spot) && !avoid.some((a) => overlaps(box, a))) return c
  }
  return null
}

/** A Radix dialog, sheet or menu is open on top of the page: let it handle Escape. */
function layerOpen(): boolean {
  return !!document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [role="menu"][data-state="open"]')
}

/**
 * Five steps across the demo with a spotlight on a real element. The page stays usable
 * underneath (the spotlight does not catch clicks), so step 3 can wait for the visitor
 * to mark an invoice paid.
 */
export function TourProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const seen = useTourSeen()
  const invoices = useInvoices()
  const [index, setIndex] = useState<number | null>(null)
  const [watchId, setWatchId] = useState<string | null>(null)
  const [paid, setPaid] = useState(false)
  const opener = useRef<HTMLElement | null>(null)

  const unpaid = useMemo(() => invoices.find((r) => r.status === 'overdue') ?? invoices.find((r) => r.status === 'sent'), [invoices])
  const watched = watchId ? invoices.find((r) => r.invoice.id === watchId) : undefined

  // The invoice picked at step 3 was paid (in this tab or another): remember it for the tax caption.
  if (watched?.status === 'paid' && !paid) setPaid(true)

  const start = useCallback(() => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setWatchId(null)
    setPaid(false)
    setIndex(0)
  }, [])

  const close = useCallback((how: 'done' | 'dismissed') => {
    setIndex(null)
    markTourSeen(how)
    const back = opener.current
    opener.current = null
    if (back?.isConnected) back.focus({ preventScroll: true })
  }, [])

  const go = useCallback(
    (next: number) => {
      if (next >= TOUR_STEPS.length) return close('done')
      if (TOUR_STEPS[next].id === 'invoices' && !watchId) setWatchId(unpaid?.invoice.id ?? null)
      setIndex(Math.max(0, next))
    },
    [close, watchId, unpaid],
  )

  const value = useMemo(() => ({ active: index !== null, start }), [index, start])
  const step = index === null ? null : TOUR_STEPS[index]

  // Each step lives on its own page.
  useEffect(() => {
    if (step && pathname !== step.path) router.push(step.path)
  }, [step, pathname, router])

  return (
    <TourContext.Provider value={value}>
      {children}
      {step && index !== null && (
        <TourStepView
          key="tour"
          index={index}
          onPage={pathname === step.path}
          text={caption(step.id, { paid, hasUnpaid: !!unpaid || !!watched, overdue: (watched ?? unpaid)?.status === 'overdue' })}
          waiting={step.id === 'invoices' && !!watchId && !paid}
          onBack={() => go(index - 1)}
          onNext={() => go(index + 1)}
          onClose={() => close(index === TOUR_STEPS.length - 1 ? 'done' : 'dismissed')}
        />
      )}
      {seen === false && index === null && <TourInvite onStart={start} onDismiss={() => markTourSeen('dismissed')} />}
    </TourContext.Provider>
  )
}

interface StepViewProps {
  index: number
  onPage: boolean
  text: string
  /** Step 3 before the invoice is paid: "Next" reads "Skip this step". */
  waiting: boolean
  onBack: () => void
  onNext: () => void
  onClose: () => void
}

function TourStepView({ index, onPage, text, waiting, onBack, onNext, onClose }: StepViewProps) {
  const step = TOUR_STEPS[index]
  const reduced = useReducedMotionSafe()
  const cardRef = useRef<HTMLDivElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const last = index === TOUR_STEPS.length - 1
  // Results are tagged with the step they belong to, so a new step starts clean without resetting state.
  const stepKey = onPage ? step.id : null
  const [found, setFound] = useState<{ key: string; el: HTMLElement } | null>(null)
  const target = found && found.key === stepKey ? found.el : null
  const [measured, setMeasured] = useState<{ el: HTMLElement; rect: Rect } | null>(null)
  const rect = measured && measured.el === target ? measured.rect : null
  const [cardSize, setCardSize] = useState<{ width: number; height: number } | null>(null)

  // Find the step's element once its page has rendered; fall back to the page heading.
  useEffect(() => {
    if (!stepKey) return
    let tries = 0
    let timer = 0
    const look = () => {
      const el = findTarget(step.targets, tries >= 30)
      if (el) {
        setFound({ key: stepKey, el })
        el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' })
        return
      }
      tries++
      timer = window.setTimeout(look, 100)
    }
    timer = window.setTimeout(look, 0)
    return () => window.clearTimeout(timer)
  }, [step, stepKey, reduced])

  // Follow the element while the page scrolls, resizes or re-renders.
  useEffect(() => {
    if (!target || !stepKey) return
    let frame = 0
    const tick = () => {
      const el = target.isConnected ? target : findTarget(step.targets, true)
      if (el && el !== target) {
        setFound({ key: stepKey, el })
        return
      }
      if (el) {
        const r = el.getBoundingClientRect()
        const next = { top: Math.round(r.top) - PAD, left: Math.round(r.left) - PAD, width: Math.round(r.width) + PAD * 2, height: Math.round(r.height) + PAD * 2 }
        setMeasured((prev) =>
          prev && prev.el === el && prev.rect.top === next.top && prev.rect.left === next.left && prev.rect.width === next.width && prev.rect.height === next.height
            ? prev
            : { el, rect: next },
        )
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, step, stepKey])

  useEffect(() => {
    const card = cardRef.current
    if (!card) return
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.borderBoxSize?.[0]
      setCardSize(box ? { width: box.inlineSize, height: box.blockSize } : { width: card.offsetWidth, height: card.offsetHeight })
    })
    ro.observe(card)
    return () => ro.disconnect()
  }, [])

  // Card next to the spotlight on wide screens; pinned to a corner (or the bottom on phones) otherwise.
  const cardPos = rect && cardSize && target && window.innerWidth >= 640 ? placeCard(rect, cardSize, target) : null

  // Focus the primary button when the tour opens; it stays there from step to step.
  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !layerOpen()) {
        onClose()
      }
    }
    // Capture phase: runs before an open sheet or dialog handles the same Escape and closes itself.
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  return (
    <>
      {rect && (
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none fixed z-40 rounded-md outline-2 outline-offset-2 outline-lime',
            'shadow-[0_0_0_9999px_rgb(20_19_15/0.32)] dark:shadow-[0_0_0_9999px_rgb(0_0_0/0.55)]',
            !reduced && 'transition-[top,left,width,height] duration-300 ease-out',
          )}
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
        />
      )}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tour-title"
        aria-describedby="tour-text"
        className={cn(
          'fixed inset-x-3 bottom-3 z-40 rounded-md border border-border-strong bg-card p-4 text-card-foreground shadow-[3px_3px_0_0_var(--foreground)] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[22rem]',
          cardPos && 'sm:right-auto sm:bottom-auto',
        )}
        style={cardPos ? { top: cardPos.top, left: cardPos.left } : undefined}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase tabular-nums">
            Tour · {index + 1} of {TOUR_STEPS.length}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close the tour"
            className="-m-1 rounded-sm p-1 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X className="size-4" />
          </button>
        </div>
        <div aria-live="polite">
          <h2 id="tour-title" className="mt-1.5 font-display text-lg font-semibold tracking-tight">
            {step.title}
          </h2>
          <p id="tour-text" className="mt-1.5 text-sm text-pretty text-muted-foreground">
            {text}
          </p>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {index > 0 && (
            <Button type="button" variant="ghost" size="sm" onClick={onBack} className="-ml-2 gap-1">
              <ArrowLeft aria-hidden="true" />
              Back
            </Button>
          )}
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            Skip tour
          </button>
          <Button ref={nextRef} type="button" size="sm" variant={waiting ? 'outline' : 'default'} onClick={onNext} className="ml-auto gap-1">
            {last ? 'Finish' : waiting ? 'Skip this step' : 'Next'}
            {!last && <ArrowRight aria-hidden="true" />}
          </Button>
        </div>
      </div>
    </>
  )
}

/** First visit only: a small card, never a modal. */
function TourInvite({ onStart, onDismiss }: { onStart: () => void; onDismiss: () => void }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setShown(true), 1200)
    return () => window.clearTimeout(t)
  }, [])
  if (!shown) return null
  return (
    <aside
      aria-label="Guided tour"
      className="fixed inset-x-3 bottom-3 z-40 flex items-center gap-3 rounded-md border border-border bg-card py-2.5 pr-2.5 pl-4 text-sm shadow-[2px_2px_0_0_var(--border-strong)] motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-sm"
    >
      <p className="min-w-0 flex-1">
        New here?{' '}
        <button type="button" onClick={onStart} className="font-medium underline decoration-lime decoration-2 underline-offset-4 hover:decoration-foreground">
          Take the 60-second tour
        </button>
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss the tour invitation"
        className="rounded-sm p-1 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <X className="size-4" />
      </button>
    </aside>
  )
}
