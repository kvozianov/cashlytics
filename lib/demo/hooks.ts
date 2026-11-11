'use client'

import { useMemo } from 'react'

import {
  accountBalances,
  balanceSeries,
  budgetProgress,
  byCategory,
  filterByRange,
  kpis,
  liquidBalance,
  monthlySeries,
  periodRange,
  previousRange,
  totalBalance,
} from './analytics'
import { needsReview } from './categorize'
import { anomalies, detectSubscriptions, forecast, healthScore, weakPoints, type ForecastScenario } from './insights'
import { clientStats, invoiceStatus, invoiceTotal, receivablesSummary } from './invoices'
import { LESSONS } from './lessons'
import { useDemo } from './store'
import { estimateTax, whatIf, type WhatIfInput } from './tax'
import type { MonthKey, Period } from './types'

/** The current state only. */
export function useDemoState() {
  return useDemo().state
}

export function useDemoActions() {
  return useDemo().actions
}

export function useToday() {
  return useDemo().today
}

export function usePersona() {
  return useDemo().persona
}

/** Selected period (from the top bar) and its date range; pass a period to override. */
export function usePeriod(override?: Period) {
  const { state, today } = useDemo()
  const period = override ?? state.period
  return useMemo(() => ({ period, range: periodRange(period, today), previous: previousRange(period, today) }), [period, today])
}

/** Transactions inside the selected period, newest first. */
export function usePeriodTransactions(override?: Period) {
  const { state } = useDemo()
  const { range } = usePeriod(override)
  return useMemo(() => filterByRange(state.transactions, range), [state.transactions, range])
}

export function useKpis(override?: Period) {
  const { state, today } = useDemo()
  const period = override ?? state.period
  return useMemo(() => kpis(state, period, today), [state, period, today])
}

/** Income/expenses/net per month, oldest first, ending with this month. */
export function useMonthlySeries(months = 12) {
  const { state, today } = useDemo()
  return useMemo(() => monthlySeries(state.transactions, today, months), [state.transactions, today, months])
}

/** Totals per category for the selected period, largest first. */
export function useCategoryBreakdown(kind: 'income' | 'expense' = 'expense', override?: Period) {
  const transactions = usePeriodTransactions(override)
  return useMemo(() => byCategory(transactions, kind), [transactions, kind])
}

export function useAccountBalances() {
  const { state, today } = useDemo()
  return useMemo(
    () => ({
      accounts: accountBalances(state, today),
      total: totalBalance(state, today),
      liquid: liquidBalance(state, today),
    }),
    [state, today],
  )
}

/** End-of-day balance of all accounts across the selected period. */
export function useBalanceSeries(override?: Period) {
  const { state } = useDemo()
  const { range } = usePeriod(override)
  return useMemo(() => balanceSeries(state, range), [state, range])
}

export function useTaxEstimate(year?: number) {
  const { state, today } = useDemo()
  const y = year ?? Number(today.slice(0, 4))
  return useMemo(() => estimateTax(state, y, today), [state, y, today])
}

export function useTaxWhatIf(input: WhatIfInput, year?: number) {
  const { state } = useDemo()
  const estimate = useTaxEstimate(year)
  const { incomeDeltaPct, extraDeductible } = input
  return useMemo(
    () => whatIf(estimate, state.taxSettings, { incomeDeltaPct, extraDeductible }),
    [estimate, state.taxSettings, incomeDeltaPct, extraDeductible],
  )
}

export function useHealthScore() {
  const { state, today } = useDemo()
  return useMemo(() => healthScore(state, today), [state, today])
}

export function useWeakPoints() {
  const { state, today } = useDemo()
  return useMemo(() => weakPoints(state, today), [state, today])
}

export function useSubscriptions() {
  const { state, today } = useDemo()
  return useMemo(() => detectSubscriptions(state, today), [state, today])
}

export function useAnomalies() {
  const { state, today } = useDemo()
  return useMemo(() => anomalies(state, today), [state, today])
}

export function useForecast(months = 3, scenario: ForecastScenario = {}) {
  const { state, today } = useDemo()
  const { incomeChangePct, extraMonthlyCost } = scenario
  return useMemo(() => forecast(state, today, months, { incomeChangePct, extraMonthlyCost }), [state, today, months, incomeChangePct, extraMonthlyCost])
}

/** Transactions waiting for a person to confirm the category, newest first. */
export function useReviewQueue() {
  const { state } = useDemo()
  return useMemo(() => state.transactions.filter(needsReview), [state.transactions])
}

/** Invoices with derived status, total and client, newest first. */
export function useInvoices() {
  const { state, today } = useDemo()
  return useMemo(
    () =>
      state.invoices.map((invoice) => ({
        invoice,
        status: invoiceStatus(invoice, today),
        total: invoiceTotal(invoice),
        client: state.clients.find((c) => c.id === invoice.clientId),
      })),
    [state.invoices, state.clients, today],
  )
}

export function useReceivables() {
  const { state, today } = useDemo()
  return useMemo(() => receivablesSummary(state.invoices, today), [state.invoices, today])
}

export function useClientStats() {
  const { state, today } = useDemo()
  return useMemo(() => clientStats(state, today), [state, today])
}

/** Spending against each budget for a month (default: this month). */
export function useBudgetProgress(month?: MonthKey) {
  const { state, today } = useDemo()
  return useMemo(() => budgetProgress(state, today, month), [state, today, month])
}

/** All lessons with the personalised sentence and whether each is completed. */
export function useLessons() {
  const { state, today } = useDemo()
  return useMemo(
    () =>
      LESSONS.map((lesson) => ({
        lesson,
        personal: lesson.personalise(state, today),
        completed: state.completedLessons.includes(lesson.id),
      })),
    [state, today],
  )
}
