'use client'

import { useCallback, useState } from 'react'

import { storageKey } from '@/lib/demo/storage'
import type { PersonaId } from '@/lib/demo/types'

// Lives under the persona's own key, so "Reset demo" (clearState) removes it too.
export const dismissedKey = (persona: PersonaId) => `${storageKey(persona)}:dismissed-insights`

function read(persona: PersonaId): string[] {
  try {
    const raw = window.localStorage.getItem(dismissedKey(persona))
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  } catch {
    return []
  }
}

/** Weak points the visitor dismissed, remembered per persona in this browser. */
export function useDismissed(persona: PersonaId) {
  // Read on every render: cheap, and it picks up a reset made elsewhere on the page.
  const [, setVersion] = useState(0)
  const ids = read(persona)

  const write = useCallback(
    (next: string[]) => {
      try {
        if (next.length) window.localStorage.setItem(dismissedKey(persona), JSON.stringify(next))
        else window.localStorage.removeItem(dismissedKey(persona))
      } catch {
        // storage blocked: nothing to remember
      }
      setVersion((v) => v + 1)
    },
    [persona],
  )

  return {
    ids,
    dismiss: (id: string) => write([...ids.filter((x) => x !== id), id]),
    restoreAll: () => write([]),
  }
}
