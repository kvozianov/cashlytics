import { describe, expect, it } from 'vitest'

import { LESSONS } from '../lessons'
import { PERSONAS, stateFor, TODAY } from './fixtures'

describe('lessons', () => {
  it('has 8–10 complete lessons with unique ids', () => {
    expect(LESSONS.length).toBeGreaterThanOrEqual(8)
    expect(LESSONS.length).toBeLessThanOrEqual(10)
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length)
    for (const l of LESSONS) {
      expect(l.body.length).toBeGreaterThanOrEqual(3)
      expect(l.takeaway.length).toBeGreaterThan(20)
      expect(l.tryIt.href.startsWith('/demo')).toBe(true)
    }
  })

  it.each(PERSONAS)('personalises every lesson with real numbers for %s', (persona) => {
    for (const l of LESSONS) {
      const sentence = l.personalise(stateFor(persona), TODAY)
      expect(sentence.length).toBeGreaterThan(20)
      expect(sentence).not.toMatch(/NaN|undefined|Infinity/)
    }
    const withNumbers = LESSONS.filter((l) => /\d/.test(l.personalise(stateFor(persona), TODAY)))
    expect(withNumbers.length).toBeGreaterThanOrEqual(LESSONS.length - 2)
  })
})
