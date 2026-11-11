import { describe, expect, it } from 'vitest'

import { parseAmount, parseDate, parseStatementCsv, sampleCsv, splitCsvLine, toCsv } from '../csv'
import { stateFor, TODAY } from './fixtures'

describe('CSV helpers', () => {
  it('splits quoted fields with delimiters and doubled quotes inside', () => {
    expect(splitCsvLine('2026-11-01,"ACME, INC ""WEST""",-12.50', ',')).toEqual(['2026-11-01', 'ACME, INC "WEST"', '-12.50'])
  })

  it.each([
    ['1,234.50', 1234.5],
    ['-12.00', -12],
    ['(45.00)', -45],
    ['$1 234,50', 1234.5],
    ['1.234,50', 1234.5],
    ['12,5', 12.5],
    ['abc', null],
  ])('parses amount %s', (raw, expected) => {
    expect(parseAmount(raw)).toBe(expected)
  })

  it.each([
    ['2026-03-14', '2026-03-14'],
    ['14/03/2026', '2026-03-14'],
    ['03/14/2026', '2026-03-14'],
    ['14.03.2026', '2026-03-14'],
    ['31/02/2026', null],
    ['yesterday', null],
  ])('parses date %s', (raw, expected) => {
    expect(parseDate(raw)).toBe(expected)
  })
})

describe('parseStatementCsv', () => {
  it('reads a comma file with a signed amount column', () => {
    const r = parseStatementCsv('Date,Description,Amount\n2026-11-01,"SQ *BLUE BOTTLE 0423",-5.75\n2026-11-02,ACME PAYROLL,1800.00\n')
    expect(r.delimiter).toBe(',')
    expect(r.errors).toEqual([])
    expect(r.rows).toEqual([
      { line: 2, date: '2026-11-01', description: 'SQ *BLUE BOTTLE 0423', amount: -5.75 },
      { line: 3, date: '2026-11-02', description: 'ACME PAYROLL', amount: 1800 },
    ])
  })

  it('reads a semicolon file with debit and credit columns and decimal commas', () => {
    const r = parseStatementCsv(sampleCsv(TODAY))
    expect(r.delimiter).toBe(';')
    expect(r.errors).toEqual([])
    expect(r.rows.map((x) => x.amount)).toEqual([-5.75, -17.99, 1250, -42.1])
    expect(r.rows[0].date).toBe('2026-11-08')
  })

  it('reports bad rows and keeps the good ones', () => {
    const r = parseStatementCsv(['Date;Details;Amount', '01.11.2026;Coffee;-4,50', 'not a date;Lunch;-12', '02.11.2026;;-3', '03.11.2026;Books;abc', '04.11.2026;Zero;0'].join('\n'))
    expect(r.rows).toHaveLength(1)
    expect(r.errors.map((e) => e.line)).toEqual([3, 4, 5, 6])
    expect(r.errors[0].message).toMatch(/date/i)
  })

  it('assumes date, description, amount when there is no header', () => {
    const r = parseStatementCsv('2026-11-01\tNETFLIX.COM\t-17.99')
    expect(r.delimiter).toBe('\t')
    expect(r.rows[0]).toMatchObject({ description: 'NETFLIX.COM', amount: -17.99 })
  })

  it('explains a missing amount column', () => {
    const r = parseStatementCsv('Date,Description,Category\n2026-11-01,Coffee,Food')
    expect(r.rows).toHaveLength(0)
    expect(r.errors[0].message).toMatch(/amount/i)
  })

  it('round-trips its own export', () => {
    const state = stateFor('starter')
    const sample = state.transactions.slice(0, 25)
    const r = parseStatementCsv(toCsv(sample, state.accounts))
    expect(r.errors).toEqual([])
    expect(r.rows.map((x) => [x.date, x.description, x.amount])).toEqual(sample.map((t) => [t.date, t.description, t.amount]))
  })
})
