'use client'

import Link from 'next/link'
import { ChevronDown, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import { GLOSSARY } from './content'

/** Plain-language definitions, searchable. */
export function Glossary() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(() => typeof window !== 'undefined' && window.location.hash === '#glossary')
  const items = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const list = [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term))
    return needle ? list.filter((t) => t.term.toLowerCase().includes(needle) || t.definition.toLowerCase().includes(needle)) : list
  }, [q])
  return (
    <Collapsible asChild open={open} onOpenChange={setOpen}>
      <section id="glossary" aria-labelledby="glossary-title" className="scroll-mt-28 border-t border-border pt-6">
        <h2 id="glossary-title">
          <CollapsibleTrigger className="flex w-full items-baseline justify-between gap-4 text-left">
            <span className="font-display text-xl font-semibold tracking-tight">
              Glossary <span className="font-sans text-base font-normal text-muted-foreground">· {GLOSSARY.length} money words in plain English</span>
            </span>
            <ChevronDown aria-hidden="true" className={cn('size-5 shrink-0 self-center text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
          </CollapsibleTrigger>
        </h2>
        <CollapsibleContent>
          <div className="relative mt-6 w-full sm:w-72">
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search terms" aria-label="Search the glossary" className="pl-8" type="search" />
          </div>
          <p aria-live="polite" className="sr-only">
            {items.length} {items.length === 1 ? 'term' : 'terms'} shown
          </p>
          {items.length ? (
            <dl className="mt-4 grid gap-x-12 md:grid-cols-2">
              {items.map((t) => (
                <div key={t.term} className="border-b border-border py-4">
                  <dt className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold">{t.term}</span>
                    {t.see && (
                      <Link href={t.see.href} className="shrink-0 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                        {t.see.label} →
                      </Link>
                    )}
                  </dt>
                  <dd className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">{t.definition}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="py-8 text-sm text-muted-foreground">
              No term matches “{q}”.{' '}
              <button type="button" className="font-medium text-foreground underline underline-offset-4" onClick={() => setQ('')}>
                Clear the search
              </button>
            </p>
          )}
        </CollapsibleContent>
      </section>
    </Collapsible>
  )
}
