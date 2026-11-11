import { generateState } from '../generate'
import type { DemoState, PersonaId } from '../types'

export const TODAY = '2026-11-11'
export const PERSONAS: PersonaId[] = ['freelancer', 'starter', 'business']

const cache = new Map<string, DemoState>()

/** Generated state, cached per persona and date (tests must not mutate it). */
export function stateFor(persona: PersonaId, today = TODAY): DemoState {
  const key = `${persona}|${today}`
  if (!cache.has(key)) cache.set(key, generateState(persona, today))
  return cache.get(key)!
}
