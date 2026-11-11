'use client'

import { useSearchParams } from 'next/navigation'

import { getLesson } from '@/lib/demo/lessons'

import { Glossary } from './glossary'
import { LessonIndex } from './lesson-index'
import { LessonReader } from './lesson-reader'

/** `/demo/learn` shows the index and glossary; `?lesson=<id>` opens that lesson. */
export function LearnView() {
  const params = useSearchParams()
  const id = params.get('lesson')
  const lesson = id ? getLesson(id) : undefined
  if (lesson) return <LessonReader id={lesson.id} />
  return (
    <div className="space-y-14">
      {id && (
        <p role="status" className="rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          There is no lesson called “{id}”. Here are all of them.
        </p>
      )}
      <LessonIndex />
      <Glossary />
    </div>
  )
}
