/** A seeded random source. `next()` returns a float in [0, 1). */
export interface Rng {
  next: () => number
}

/** mulberry32: tiny, fast and good enough for fake data. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return {
    next() {
      a = (a + 0x6d2b79f5) >>> 0
      let t = a
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    },
  }
}

/** FNV-1a string hash, used to derive seeds from readable keys. */
export function hashString(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function rngFor(...parts: (string | number)[]): Rng {
  return mulberry32(hashString(parts.join('|')))
}

/** Float in [min, max). */
export function range(rng: Rng, min: number, max: number): number {
  return min + (max - min) * rng.next()
}

/** Integer in [min, max], inclusive. */
export function int(rng: Rng, min: number, max: number): number {
  return Math.floor(range(rng, min, max + 1))
}

export function chance(rng: Rng, probability: number): boolean {
  return rng.next() < probability
}

export function pick<T>(rng: Rng, items: readonly T[]): T {
  if (items.length === 0) throw new Error('pick() needs at least one item')
  return items[Math.floor(rng.next() * items.length)]
}

/** Picks by weight; weights need not sum to 1. */
export function weighted<T>(rng: Rng, items: readonly (readonly [T, number])[]): T {
  const total = items.reduce((s, [, w]) => s + w, 0)
  let r = rng.next() * total
  for (const [item, w] of items) {
    r -= w
    if (r < 0) return item
  }
  return items[items.length - 1][0]
}

/** Normal distribution via Box–Muller. */
export function gaussian(rng: Rng, mean = 0, sd = 1): number {
  const u = 1 - rng.next()
  const v = rng.next()
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** Random digits, for bank reference numbers. */
export function digits(rng: Rng, count: number): string {
  let s = ''
  for (let i = 0; i < count; i++) s += Math.floor(rng.next() * 10)
  return s
}
