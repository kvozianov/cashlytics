'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'

import { MarginNote } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { getLesson } from '@/lib/demo/lessons'
import { usePersona, useWeakPoints } from '@/lib/demo/hooks'
import type { WeakPoint } from '@/lib/demo/insights'
import { cn } from '@/lib/utils'

import { useDismissed } from './use-dismissed'

function Row({ wp, rank, onDismiss }: { wp: WeakPoint; rank: number; onDismiss: () => void }) {
  const lesson = getLesson(wp.lessonId)
  return (
    <li className="py-6" data-tour={rank === 1 ? 'weak-point' : undefined}>
      <article aria-labelledby={`wp-${wp.id}`} className="grid gap-x-8 gap-y-3 sm:grid-cols-[2rem_minmax(0,1fr)_auto]">
        <span aria-hidden="true" className="font-mono text-sm text-muted-foreground tabular-nums">
          {String(rank).padStart(2, '0')}
        </span>
        <div className="min-w-0 space-y-3">
          <h3 id={`wp-${wp.id}`} className="font-display text-xl leading-snug font-semibold tracking-tight text-balance sm:text-2xl">
            {wp.title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button asChild size="sm" variant={rank === 1 ? 'default' : 'outline'}>
              {wp.action.href.startsWith('/demo/insights#') ? (
                // Same-page tab: a plain anchor so the hash change opens the tab.
                <a href={wp.action.href.slice('/demo/insights'.length)}>
                  {wp.action.label}
                  <ArrowRight aria-hidden="true" />
                </a>
              ) : (
                <Link href={wp.action.href}>
                  {wp.action.label}
                  <ArrowRight aria-hidden="true" />
                </Link>
              )}
            </Button>
            {lesson && (
              <Link href={`/demo/learn?lesson=${lesson.id}`} className="text-sm font-medium underline-offset-4 hover:underline">
                Learn why
              </Link>
            )}
          </div>
          <details className="group text-sm">
            <summary className="cursor-pointer text-muted-foreground marker:content-none hover:text-foreground">
              <span className="underline decoration-border underline-offset-4">The numbers behind it</span>
            </summary>
            <p className="mt-2 max-w-2xl leading-relaxed text-pretty text-muted-foreground">{wp.detail}</p>
            <button type="button" onClick={onDismiss} className="mt-2 text-muted-foreground underline underline-offset-4 hover:text-foreground">
              Dismiss this one
            </button>
          </details>
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <span className={cn('font-mono text-2xl font-medium tracking-tight tabular-nums sm:text-3xl', wp.severity === 'high' && 'text-destructive')}>{wp.metric}</span>
          {rank === 1 && (
            <MarginNote arrow="up" tone="signal" rotate={-4} size="sm" still>
              fix this one first
            </MarginNote>
          )}
        </div>
      </article>
    </li>
  )
}

/** The three weak spots that matter most; the rest are one click away. */
export function WeakPoints() {
  const persona = usePersona()
  const all = useWeakPoints()
  const { ids, dismiss, restoreAll } = useDismissed(persona.id)
  const [showAll, setShowAll] = useState(false)
  const visible = all.filter((w) => !ids.includes(w.id))
  const shown = showAll ? visible : visible.slice(0, 3)
  const hidden = all.length - visible.length

  return (
    <section aria-labelledby="weak-title">
      <h2 id="weak-title" className="font-display text-2xl font-semibold tracking-tight">
        {visible.length ? `What to fix, most important first` : 'Nothing to fix'}
      </h2>
      {shown.length ? (
        <ol className="mt-2 divide-y divide-border border-b border-border">
          {shown.map((w, i) => (
            <Row key={w.id} wp={w} rank={i + 1} onDismiss={() => dismiss(w.id)} />
          ))}
        </ol>
      ) : (
        <p className="mt-4 max-w-lg text-muted-foreground">
          {all.length
            ? 'You dismissed every weak point for this persona.'
            : 'None of the rules fired: tax is covered, clients pay on time, the buffer is healthy and costs are in line.'}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {visible.length > 3 && (
          <button type="button" onClick={() => setShowAll((v) => !v)} className="font-medium underline underline-offset-4">
            {showAll ? 'Show only the top 3' : `Show ${visible.length - 3} more`}
          </button>
        )}
        {hidden > 0 && (
          <button type="button" onClick={restoreAll} className="text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Bring back {hidden} dismissed
          </button>
        )}
      </div>
    </section>
  )
}
