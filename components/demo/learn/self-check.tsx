'use client'

import { Check, X } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

import type { Question } from './content'

/** One multiple-choice question with instant feedback. */
export function SelfCheck({ question }: { question: Question }) {
  const [picked, setPicked] = useState<number | null>(null)
  const right = picked === question.answer
  return (
    <fieldset className="space-y-3">
      <legend className="font-mono text-[11px] tracking-wider text-muted-foreground uppercase">Check yourself</legend>
      <p className="font-display text-lg leading-snug font-medium text-pretty">{question.prompt}</p>
      <div className="grid gap-2">
        {question.options.map((option, i) => {
          const chosen = picked === i
          const isAnswer = i === question.answer
          const reveal = picked !== null
          return (
            <button
              key={option}
              type="button"
              aria-pressed={chosen}
              onClick={() => setPicked(i)}
              className={cn(
                'flex items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm transition-colors duration-150',
                !reveal && 'border-border bg-card hover:border-foreground/50',
                reveal && isAnswer && 'border-success bg-success/10',
                reveal && chosen && !isAnswer && 'border-destructive bg-destructive/10',
                reveal && !chosen && !isAnswer && 'border-border bg-card opacity-70',
              )}
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-sm border border-current font-mono text-[11px]">
                {reveal && isAnswer ? <Check className="size-3.5 text-success" aria-hidden="true" /> : reveal && chosen ? <X className="size-3.5 text-destructive" aria-hidden="true" /> : String.fromCharCode(65 + i)}
              </span>
              <span>{option}</span>
            </button>
          )
        })}
      </div>
      <p aria-live="polite" className="min-h-5 text-sm text-pretty">
        {picked !== null && (
          <>
            <span className={cn('font-semibold', right ? 'text-success' : 'text-destructive')}>{right ? 'Right. ' : 'Not quite. '}</span>
            {question.explain}
          </>
        )}
      </p>
    </fieldset>
  )
}
