import { describe, expect, it } from 'vitest'

import { clearState, storageKey, type KeyValueStore } from '../storage'

function memoryStore(entries: Record<string, string>): KeyValueStore & { data: Map<string, string> } {
  const data = new Map(Object.entries(entries))
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
    get length() {
      return data.size
    },
    key: (i) => [...data.keys()][i] ?? null,
  }
}

describe('clearState extras', () => {
  it('removes the persona state and its own extra keys, nothing else', () => {
    const store = memoryStore({
      [storageKey('freelancer')]: '{}',
      [`${storageKey('freelancer')}:dismissed-insights`]: '["late-payer"]',
      [`${storageKey('starter')}:dismissed-insights`]: '["low-buffer"]',
      [storageKey('starter')]: '{}',
      'cashlytics-demo:v1:active': 'freelancer',
    })
    clearState(store, 'freelancer')
    expect([...store.data.keys()].sort()).toEqual(['cashlytics-demo:v1:active', storageKey('starter'), `${storageKey('starter')}:dismissed-insights`].sort())
  })

  it('still works with a store that cannot enumerate keys', () => {
    const data = new Map([[storageKey('business'), '{}']])
    const store: KeyValueStore = { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) }
    clearState(store, 'business')
    expect(data.size).toBe(0)
  })
})
