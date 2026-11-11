import { describe, expect, it } from 'vitest'

import { ACTIVE_PERSONA_KEY, clearState, externalChange, saveActivePersona, storageKey, UI_PREFIX, type KeyValueStore } from '../storage'

function memoryStore(entries: Record<string, string> = {}): KeyValueStore & { data: Map<string, string>; writes: number } {
  const data = new Map(Object.entries(entries))
  const store = {
    data,
    writes: 0,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.writes++
      data.set(k, v)
    },
    removeItem: (k: string) => void data.delete(k),
    get length() {
      return data.size
    },
    key: (i: number) => [...data.keys()][i] ?? null,
  }
  return store
}

describe('externalChange (another tab wrote to storage)', () => {
  it('reloads when the persona on screen was saved elsewhere', () => {
    expect(externalChange(storageKey('freelancer'), '{}', 'freelancer')).toEqual({ kind: 'reload', personaId: 'freelancer' })
  })

  it('reloads when that persona was reset elsewhere (key removed)', () => {
    expect(externalChange(storageKey('starter'), null, 'starter')).toEqual({ kind: 'reload', personaId: 'starter' })
  })

  it('follows a persona switch made in another tab', () => {
    expect(externalChange(ACTIVE_PERSONA_KEY, 'business', 'freelancer')).toEqual({ kind: 'reload', personaId: 'business' })
  })

  it('ignores the same persona, unknown personas and unrelated keys', () => {
    expect(externalChange(ACTIVE_PERSONA_KEY, 'freelancer', 'freelancer').kind).toBe('ignore')
    expect(externalChange(ACTIVE_PERSONA_KEY, 'nobody', 'freelancer').kind).toBe('ignore')
    expect(externalChange(storageKey('starter'), '{}', 'freelancer').kind).toBe('ignore')
    expect(externalChange(`${storageKey('freelancer')}:dismissed-insights`, '[]', 'freelancer').kind).toBe('ignore')
    expect(externalChange('theme', 'dark', 'freelancer').kind).toBe('ignore')
  })

  it('reloads after storage was cleared', () => {
    expect(externalChange(null, null, 'business')).toEqual({ kind: 'reload', personaId: 'business' })
  })
})

describe('saveActivePersona', () => {
  it('writes the active persona once, and only when it changes', () => {
    const store = memoryStore({ [ACTIVE_PERSONA_KEY]: 'freelancer' })
    saveActivePersona(store, 'freelancer')
    expect(store.writes).toBe(0)
    saveActivePersona(store, 'starter')
    expect(store.data.get(ACTIVE_PERSONA_KEY)).toBe('starter')
    expect(store.writes).toBe(1)
    expect(store.data.has(storageKey('starter'))).toBe(false)
  })

  it('survives a missing store', () => {
    expect(() => saveActivePersona(null, 'business')).not.toThrow()
  })
})

describe('clearState and shared interface keys', () => {
  it('also clears tour progress and other ui keys, but not other personas or the theme', () => {
    const store = memoryStore({
      [storageKey('freelancer')]: '{}',
      [`${UI_PREFIX}tour`]: 'done',
      [storageKey('business')]: '{}',
      [ACTIVE_PERSONA_KEY]: 'freelancer',
      theme: 'dark',
    })
    clearState(store, 'freelancer')
    expect([...store.data.keys()].sort()).toEqual([ACTIVE_PERSONA_KEY, storageKey('business'), 'theme'].sort())
  })
})
