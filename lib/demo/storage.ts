import { generateState } from './generate'
import { DEFAULT_PERSONA, isPersonaId } from './personas'
import type { DemoState, ISODate, PersonaId } from './types'

export const STORAGE_PREFIX = 'cashlytics-demo:v1:'
export const ACTIVE_PERSONA_KEY = `${STORAGE_PREFIX}active`
/** Interface preferences that are not tied to a persona (e.g. the tour). "Reset demo" clears them too. */
export const UI_PREFIX = `${STORAGE_PREFIX}ui:`

export function storageKey(personaId: PersonaId): string {
  return `${STORAGE_PREFIX}${personaId}`
}

/** Minimal `localStorage` surface, so tests can pass a fake. */
export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
  /** Optional enumeration (real `localStorage` has it); used to clear per-persona extras on reset. */
  readonly length?: number
  key?(index: number): string | null
}

function isDemoState(value: unknown, personaId: PersonaId): value is DemoState {
  if (!value || typeof value !== 'object') return false
  const v = value as Partial<DemoState>
  return v.version === 1 && v.personaId === personaId && Array.isArray(v.transactions) && Array.isArray(v.invoices) && typeof v.generatedOn === 'string'
}

/**
 * Picks the state to show: the stored one if the person has changed something,
 * otherwise freshly generated data that ends today (keeping their period and lesson progress).
 */
export function resolveState(raw: string | null, personaId: PersonaId, today: ISODate): DemoState {
  let stored: DemoState | null = null
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (isDemoState(parsed, personaId)) stored = parsed
    } catch {
      stored = null
    }
  }
  if (stored && (stored.edited || stored.generatedOn === today)) return stored
  const fresh = generateState(personaId, today)
  if (stored) return { ...fresh, period: stored.period, completedLessons: stored.completedLessons }
  return fresh
}

export function loadState(store: KeyValueStore | null, personaId: PersonaId, today: ISODate): DemoState {
  let raw: string | null = null
  try {
    raw = store?.getItem(storageKey(personaId)) ?? null
  } catch {
    raw = null
  }
  return resolveState(raw, personaId, today)
}

export function saveState(store: KeyValueStore | null, state: DemoState): void {
  try {
    store?.setItem(storageKey(state.personaId), JSON.stringify(state))
    store?.setItem(ACTIVE_PERSONA_KEY, state.personaId)
  } catch {
    // Storage full or blocked (private mode): the demo keeps working in memory.
  }
}

/**
 * Removes a persona's saved state, plus any extra keys stored under it
 * (`cashlytics-demo:v1:<persona>:<something>`, e.g. dismissed insights)
 * and the shared interface keys (`cashlytics-demo:v1:ui:*`, e.g. tour progress).
 */
export function clearState(store: KeyValueStore | null, personaId: PersonaId): void {
  try {
    store?.removeItem(storageKey(personaId))
    if (store?.key && typeof store.length === 'number') {
      const prefixes = [`${storageKey(personaId)}:`, UI_PREFIX]
      const extras: string[] = []
      for (let i = 0; i < store.length; i++) {
        const k = store.key(i)
        if (k && prefixes.some((p) => k.startsWith(p))) extras.push(k)
      }
      extras.forEach((k) => store.removeItem(k))
    }
  } catch {
    // ignore
  }
}

/**
 * What a tab should do when another tab writes to storage (`storage` event).
 * `reload` means: read that persona's state from storage and show it.
 * Writes made by this tab never arrive here, so adopting without saving back cannot loop.
 */
export type ExternalChange = { kind: 'ignore' } | { kind: 'reload'; personaId: PersonaId }

export function externalChange(key: string | null, newValue: string | null, current: PersonaId): ExternalChange {
  // `localStorage.clear()` in another tab.
  if (key === null) return { kind: 'reload', personaId: current }
  if (key === storageKey(current)) return { kind: 'reload', personaId: current }
  if (key === ACTIVE_PERSONA_KEY && isPersonaId(newValue) && newValue !== current) return { kind: 'reload', personaId: newValue }
  return { kind: 'ignore' }
}

/** Remembers the persona in use, without touching its data. */
export function saveActivePersona(store: KeyValueStore | null, personaId: PersonaId): void {
  try {
    if (store?.getItem(ACTIVE_PERSONA_KEY) !== personaId) store?.setItem(ACTIVE_PERSONA_KEY, personaId)
  } catch {
    // ignore
  }
}

/** Persona from `?persona=`, then the last one used, then the default. */
export function initialPersona(search: string, store: KeyValueStore | null): PersonaId {
  const fromQuery = new URLSearchParams(search).get('persona')
  if (isPersonaId(fromQuery)) return fromQuery
  let stored: string | null = null
  try {
    stored = store?.getItem(ACTIVE_PERSONA_KEY) ?? null
  } catch {
    stored = null
  }
  return isPersonaId(stored) ? stored : DEFAULT_PERSONA
}
