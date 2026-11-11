'use client'

import { useSyncExternalStore } from 'react'

import { UI_PREFIX } from '@/lib/demo/storage'

/** `done` or `dismissed`; cleared by "Reset demo" with the other `ui:` keys. */
export const TOUR_KEY = `${UI_PREFIX}tour`
const LOCAL_EVENT = 'cashlytics-tour'

function subscribe(onChange: () => void) {
  const onStorage = (e: StorageEvent) => {
    if (e.key === TOUR_KEY || e.key === null) onChange()
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(LOCAL_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(LOCAL_EVENT, onChange)
  }
}

function read(): string | null {
  try {
    return window.localStorage.getItem(TOUR_KEY)
  } catch {
    // Storage blocked: behave as if seen, so the invite never nags.
    return 'blocked'
  }
}

/** Whether the visitor has finished or dismissed the tour. `null` while unknown (server render). */
export function useTourSeen(): boolean | null {
  const value = useSyncExternalStore(subscribe, read, () => 'server')
  if (value === 'server') return null
  return value !== null
}

export function markTourSeen(how: 'done' | 'dismissed') {
  try {
    window.localStorage.setItem(TOUR_KEY, how)
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(LOCAL_EVENT))
}
