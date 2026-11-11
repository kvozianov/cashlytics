"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export type Lesson = { n: number; title: string; front: string; back: string }

/** An index card: the lesson on the front, the line about your numbers on the back. */
export function LessonCard({ lesson }: { lesson: Lesson }) {
  const [turned, setTurned] = useState(false)
  return (
    <div className="transition-transform duration-200 ease-out lg:hover:-translate-y-5">
      <button
        type="button"
        aria-pressed={turned}
        onClick={() => setTurned((t) => !t)}
        className="flip-card block h-[20rem] w-[15.5rem] rounded-[4px] text-left"
      >
        <span className="flip-inner block">
          <span className="flip-face ruled flex flex-col rounded-[4px] border border-foreground/60 bg-card p-5 shadow-[3px_3px_0_0_var(--foreground)] [--rule:1.75rem]">
            <span aria-hidden="true" className="absolute inset-x-0 top-[3.25rem] h-px bg-signal/70" />
            <span className="flex items-baseline justify-between font-mono text-[10.5px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
              <span>Lesson {String(lesson.n).padStart(2, "0")}</span>
              <span>2 min</span>
            </span>
            <span className="mt-8 font-display text-[1.75rem] leading-[1.02] font-bold tracking-[-0.03em] text-foreground">
              {lesson.title}
            </span>
            <span className="mt-3 text-[0.9rem] leading-[1.75rem] text-muted-foreground">{lesson.front}</span>
            <span aria-hidden="true" className="mt-auto font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              Turn over ↻
            </span>
          </span>
          <span
            className={cn(
              "flip-face flip-back flex flex-col rounded-[4px] bg-primary p-5 text-primary-foreground shadow-[3px_3px_0_0_var(--lime)]",
            )}
          >
            <span className="font-mono text-[10.5px] font-medium tracking-[0.16em] uppercase opacity-70">In your numbers</span>
            <span className="mt-6 font-display text-[1.45rem] leading-[1.12] font-semibold tracking-[-0.02em]">{lesson.back}</span>
            <span className="mt-auto font-mono text-[10px] tracking-[0.14em] uppercase opacity-60">
              Example · Maya, fictional
            </span>
          </span>
        </span>
      </button>
    </div>
  )
}
