'use client'

import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useEffect } from 'react'

import { Marker, MarginNote, Receipt, Stamp } from '@/components/brand'
import { Button } from '@/components/ui/button'
import { useDemoActions, useLessons, usePersona } from '@/lib/demo/hooks'

import { QUESTIONS } from './content'
import { SelfCheck } from './self-check'
import { LessonWidget } from './widgets'

/** One lesson: body, the reader's own numbers, a small interactive piece, a question, and what to do next. */
export function LessonReader({ id }: { id: string }) {
  const lessons = useLessons()
  const actions = useDemoActions()
  const persona = usePersona()
  const index = lessons.findIndex((l) => l.lesson.id === id)
  const { lesson, personal, completed } = lessons[index]
  const next = lessons[(index + 1) % lessons.length]
  const question = QUESTIONS[lesson.id]

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [id])

  return (
    <article aria-labelledby="lesson-title" className="space-y-14">
      <div>
        <Link href="/demo/learn" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          All lessons
        </Link>
        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl space-y-3">
            <p className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
              Lesson {index + 1} of {lessons.length} · {lesson.minutes} min read
            </p>
            <h1 id="lesson-title" className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              {lesson.title}
            </h1>
            <p className="text-lg text-pretty text-muted-foreground">{lesson.summary}</p>
          </div>
          {completed && (
            <Stamp tone="success" rotate={4}>
              Done
            </Stamp>
          )}
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,40rem)_minmax(0,1fr)] lg:gap-14">
        <div className="min-w-0 space-y-12">
          <div className="space-y-4 text-[17px] leading-relaxed text-pretty">
            {lesson.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          <p className="border-l-2 border-foreground pl-4 font-display text-xl leading-snug font-medium text-pretty">
            <span className="mb-1 block font-mono text-[11px] font-normal tracking-wider text-muted-foreground uppercase">Remember</span>
            <Marker still>{lesson.takeaway}</Marker>
          </p>

          <div className="lg:hidden">
            <InYourNumbers personal={personal} name={persona.kind === 'business' ? persona.name : persona.name.split(' ')[0]} />
          </div>

          <LessonWidget key={`${persona.id}-${lesson.id}`} id={lesson.id} />

          {question && <SelfCheck key={`q-${persona.id}-${lesson.id}`} question={question} />}

          <div className="flex flex-wrap items-center gap-3 border-t border-border-strong pt-6">
            {completed ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-success">
                <Check aria-hidden="true" className="size-4" />
                Marked as done
              </span>
            ) : (
              <Button className="btn-ink" onClick={() => actions.completeLesson(lesson.id)}>
                <Check aria-hidden="true" />
                Mark as done
              </Button>
            )}
            <Button asChild variant="outline">
              <Link href={lesson.tryIt.href}>{lesson.tryIt.label}</Link>
            </Button>
            <Link href={`/demo/learn?lesson=${next.lesson.id}`} className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline">
              Next: {next.lesson.title}
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <InYourNumbers personal={personal} name={persona.kind === 'business' ? persona.name : persona.name.split(' ')[0]} />
          </div>
        </aside>
      </div>
    </article>
  )
}

function InYourNumbers({ personal, name }: { personal: string; name: string }) {
  return (
    <div className="space-y-2">
      <Receipt edge="both" still className="text-[13px]">
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">In your numbers · {name}</p>
        <p className="mt-3 font-sans text-[15px] leading-relaxed text-pretty text-foreground">{personal}</p>
      </Receipt>
      <MarginNote arrow="up" tone="ink" rotate={-3} size="sm" still className="ml-6">
        that&apos;s you
      </MarginNote>
    </div>
  )
}
