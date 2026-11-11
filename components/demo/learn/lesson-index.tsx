'use client'

import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

import { MarginNote, Marker } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { useLessons, useWeakPoints } from '@/lib/demo/hooks'
import { cn } from '@/lib/utils'


/** Progress, the lesson picked for this persona, and the full list. */
export function LessonIndex() {
  const lessons = useLessons()
  const weak = useWeakPoints()
  const done = lessons.filter((l) => l.completed).length
  const fromWeak = weak.map((w) => lessons.find((l) => l.lesson.id === w.lessonId)).find((l) => l && !l.completed)
  const recommended = fromWeak ?? lessons.find((l) => !l.completed) ?? lessons[0]
  const because = weak.find((w) => w.lessonId === recommended.lesson.id)
  const recIndex = lessons.indexOf(recommended)

  return (
    <div className="space-y-16">
      <header className="grid gap-6 lg:grid-cols-12 lg:items-end">
        <div className="space-y-2 lg:col-span-8">
          <p className="font-mono text-xs tracking-wider text-muted-foreground uppercase">07 — Learn</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Two-minute lessons, worked out with your own numbers</h1>
        </div>
        <div className="lg:col-span-4">
          <p className="flex items-baseline justify-between font-mono text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="text-foreground tabular-nums">
              {done} of {lessons.length} done
            </span>
          </p>
          <ol aria-label={`${done} of ${lessons.length} lessons done`} className="mt-2 flex gap-1">
            {lessons.map((l) => (
              <li key={l.lesson.id} title={l.lesson.title} className={cn('h-2.5 flex-1 rounded-[2px] transition-colors duration-200', l.completed ? 'bg-foreground' : 'bg-foreground/15')} />
            ))}
          </ol>
        </div>
      </header>

      <section aria-labelledby="rec-title" className="grid gap-6 lg:grid-cols-[minmax(0,40rem)_minmax(0,1fr)] lg:items-center">
        <div className="min-w-0 space-y-3">
          <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            Recommended for you · lesson {String(recIndex + 1).padStart(2, '0')}
          </p>
          <h2 id="rec-title" className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            <Marker still>{recommended.lesson.title}</Marker>
          </h2>
          <p className="max-w-xl text-[15px] text-pretty text-muted-foreground">{recommended.lesson.summary}</p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild className="btn-ink">
              <Link href={`/demo/learn?lesson=${recommended.lesson.id}`}>
                {recommended.completed ? 'Read it again' : 'Start the lesson'}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <span className="font-mono text-xs text-muted-foreground">{recommended.lesson.minutes} min read</span>
          </div>
        </div>
        {because && (
          <div className="self-center">
            <MarginNote arrow="left" tone="signal" rotate={-3} size="md" still>
              because: {because.title.toLowerCase()}
            </MarginNote>
          </div>
        )}
      </section>

      <section aria-labelledby="all-title">
        <div className="flex items-end justify-between gap-3 border-b border-border-strong pb-3">
          <h2 id="all-title" className="font-display text-2xl font-semibold tracking-tight">
            All lessons
          </h2>
        </div>
        <ol className="grid gap-x-10 md:grid-cols-2">
          {lessons.map((l, i) => (
            <li key={l.lesson.id} className="border-b border-border">
              <Link
                href={`/demo/learn?lesson=${l.lesson.id}`}
                className="group grid grid-cols-[2rem_minmax(0,1fr)_auto] items-baseline gap-x-3 py-4 focus-visible:outline-offset-[-2px]"
              >
                <span className="font-mono text-sm text-muted-foreground tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 font-medium tracking-tight text-pretty underline-offset-4 group-hover:underline">{l.lesson.title}</span>
                <span>
                  {l.completed ? (
                    <span className="inline-flex items-center gap-1 rounded-sm border border-success/60 px-1.5 py-0.5 font-mono text-[11px] text-success uppercase">
                      <Check aria-hidden="true" className="size-3" />
                      Done
                    </span>
                  ) : (
                    <span className="font-mono text-[11px] text-muted-foreground">{l.lesson.minutes} min</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
