import { describe, expect, it } from 'vitest'

import { formatDate, formatMonth, money, moneyCompact, pct, relativeDays, signedMoney, signedPct } from '../format'

describe('format', () => {
  it('formats money with a real minus sign', () => {
    expect(money(1234.5)).toBe('$1,234.50')
    expect(money(-12)).toBe('−$12.00')
    expect(money(1234.5, { whole: true })).toBe('$1,235')
    expect(signedMoney(2400)).toBe('+$2,400.00')
    expect(signedMoney(-4.5)).toBe('−$4.50')
    expect(signedMoney(0)).toBe('$0.00')
  })

  it('shortens large amounts', () => {
    expect(moneyCompact(950)).toBe('$950')
    expect(moneyCompact(1250)).toBe('$1.3k')
    expect(moneyCompact(12_400)).toBe('$12k')
    expect(moneyCompact(-2_000_000)).toBe('−$2M')
  })

  it('formats percentages and dates', () => {
    expect(pct(0.123)).toBe('12%')
    expect(signedPct(0.05)).toBe('+5%')
    expect(signedPct(-0.1)).toBe('−10%')
    expect(formatDate('2026-11-03')).toBe('3 Nov 2026')
    expect(formatDate('2026-11-03', { year: false, weekday: true })).toBe('Tue 3 Nov')
    expect(formatMonth('2026-03', { long: true })).toBe('March 2026')
    expect(relativeDays('2026-11-10', '2026-11-11')).toBe('yesterday')
    expect(relativeDays('2026-11-21', '2026-11-11')).toBe('in 10 days')
  })
})
