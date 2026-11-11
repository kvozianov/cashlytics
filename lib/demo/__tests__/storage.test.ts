import { describe, expect, it } from 'vitest'

import { demoReducer } from '../reducer'
import { ACTIVE_PERSONA_KEY, initialPersona, loadState, resolveState, saveState, storageKey, type KeyValueStore } from '../storage'
import { stateFor, TODAY } from './fixtures'

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) }
}

describe('storage', () => {
  it('uses versioned keys', () => {
    expect(storageKey('starter')).toBe('cashlytics-demo:v1:starter')
    expect(ACTIVE_PERSONA_KEY).toBe('cashlytics-demo:v1:active')
  })

  it('regenerates untouched data from an earlier month but keeps preferences', () => {
    const old = { ...stateFor('starter', '2026-10-20'), period: 'ytd' as const, completedLessons: ['emergency-buffer'] }
    const resolved = resolveState(JSON.stringify(old), 'starter', TODAY)
    expect(resolved.generatedOn).toBe(TODAY)
    expect(resolved.period).toBe('ytd')
    expect(resolved.completedLessons).toEqual(['emergency-buffer'])
  })

  it('keeps edited data', () => {
    const edited = demoReducer(stateFor('starter', '2026-10-20'), { type: 'completeLesson', id: 'pay-yourself-first' })
    expect(resolveState(JSON.stringify(edited), 'starter', TODAY).generatedOn).toBe('2026-10-20')
  })

  it('ignores corrupt or foreign data', () => {
    expect(resolveState('{not json', 'business', TODAY).personaId).toBe('business')
    expect(resolveState(JSON.stringify(stateFor('starter')), 'business', TODAY).personaId).toBe('business')
  })

  it('saves and loads through a key-value store', () => {
    const store = memoryStore()
    const edited = demoReducer(stateFor('freelancer'), { type: 'setBudget', categoryId: 'travel', monthlyLimit: 200 })
    saveState(store, edited)
    expect(store.data.get(ACTIVE_PERSONA_KEY)).toBe('freelancer')
    expect(loadState(store, 'freelancer', TODAY).budgets.some((b) => b.categoryId === 'travel')).toBe(true)
  })

  it('picks the persona from the query string first', () => {
    const store = memoryStore()
    store.setItem(ACTIVE_PERSONA_KEY, 'starter')
    expect(initialPersona('?persona=business', store)).toBe('business')
    expect(initialPersona('?persona=nobody', store)).toBe('starter')
    expect(initialPersona('', null)).toBe('freelancer')
  })
})
