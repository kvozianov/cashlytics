'use client'

import { Check, ChevronsUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PERSONA_IDS, PERSONAS } from '@/lib/demo/personas'
import { useDemo } from '@/lib/demo/store'
import type { Persona } from '@/lib/demo/types'
import { cn } from '@/lib/utils'

function Initials({ persona, className }: { persona: Persona; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('flex size-7 shrink-0 items-center justify-center rounded-sm border border-border-strong bg-card font-mono text-[11px] font-medium', className)}
    >
      {persona.initials}
    </span>
  )
}

/** Shows who the demo is about and switches between the three fictional personas. */
export function PersonaSwitcher() {
  const { persona, actions } = useDemo()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-2 px-1.5 sm:px-2" aria-label={`Persona: ${persona.name}. Switch persona`}>
          <Initials persona={persona} />
          <span className="hidden min-w-0 text-left leading-tight md:block">
            <span className="block max-w-40 truncate text-[13px] font-medium">{persona.name}</span>
            <span className="block max-w-40 truncate text-[11px] font-normal text-muted-foreground">{persona.role}</span>
          </span>
          <ChevronsUpDown aria-hidden="true" className="hidden size-3.5 text-muted-foreground md:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Fictional personas: switch to see a different money story</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PERSONA_IDS.map((id) => {
          const p = PERSONAS[id]
          const current = id === persona.id
          return (
            <DropdownMenuItem key={id} onSelect={() => actions.switchPersona(id)} className="items-start gap-3 py-2">
              <Initials persona={p} className="mt-0.5" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{p.name}</span>
                <span className="block text-xs text-muted-foreground">{p.role}</span>
                <span className="mt-1 block text-xs text-pretty text-muted-foreground">{p.blurb}</span>
              </span>
              {current && <Check aria-label="Current persona" className="mt-1 size-4" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
