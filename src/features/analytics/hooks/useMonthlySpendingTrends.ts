import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsQueryKeys } from '@/api/analytics/analyticsQueryKeys.ts'
import {
  fetchAnalyticsPeriodCriticality,
  fetchAnalyticsRangeOverview,
} from '@/api/analytics/analytics.ts'
import type { AnalyticsCriticalityBreakdownResponse, AnalyticsPeriodOverviewResponse } from '@/api/analytics/analytics.types.ts'
import { useStatements } from '@/features/statements/hooks/useStatements.ts'
import {
  buildLastSixMonthRanges,
  sumCriticalityAmountAcrossPeriods,
  sumCriticalityAmount,
  type MonthlySpendingTrendPoint,
} from '../utils/monthlySpendingTrend'

const toTrendPoint = (
  range: ReturnType<typeof buildLastSixMonthRanges>[number],
  response: AnalyticsPeriodOverviewResponse | undefined,
  criticality: AnalyticsCriticalityBreakdownResponse[] | undefined
): MonthlySpendingTrendPoint => ({
  ...range,
  totalAmount: response?.totalAmount ?? 0,
  essentialAmount: sumCriticalityAmount(criticality, 'Essential'),
  nonessentialAmount: sumCriticalityAmount(criticality, 'Nonessential'),
  plannedAmount: sumCriticalityAmount(criticality, 'Planned'),
  transactionCount: response?.transactionCount ?? 0,
})

export const useMonthlySpendingTrends = (account: string, monthCount: number) => {
  const statementsQuery = useStatements()
  const ranges = useMemo(() => buildLastSixMonthRanges(undefined, monthCount), [monthCount])
  const allStatementPeriods = useMemo(
    () =>
      (statementsQuery.data ?? [])
        .map((period) => period.periodName.trim())
        .filter((period) => Boolean(period)),
    [statementsQuery.data]
  )

  const query = useQuery({
    queryKey: [
      ...analyticsQueryKeys.all,
      'monthly-spending-trends',
      account,
      monthCount,
      ...ranges.flatMap((range) => [range.startDate, range.endDate]),
    ],
    queryFn: async () => {
      const responses = await Promise.all(ranges.map((range) => fetchAnalyticsRangeOverview({ startDate: range.startDate, endDate: range.endDate, account })))
      const criticalityResponses = await Promise.all(
        ranges.map((range) => fetchAnalyticsPeriodCriticality(range.statementPeriod, { account }))
      )

      return ranges.map((range, index) => toTrendPoint(range, responses[index], criticalityResponses[index]))
    },
    enabled: Boolean(account && account.trim()),
    placeholderData: (previous) => previous,
  })

  const allTimeCriticalityTotals = useQuery({
    queryKey: [...analyticsQueryKeys.all, 'monthly-spending-trends', 'all-time-criticality-totals', account, ...allStatementPeriods],
    queryFn: async () => {
      const criticalityResponses = await Promise.all(
        allStatementPeriods.map((period) => fetchAnalyticsPeriodCriticality(period, { account }))
      )

      return {
        essentialAmount: sumCriticalityAmountAcrossPeriods(criticalityResponses, 'Essential'),
        nonessentialAmount: sumCriticalityAmountAcrossPeriods(criticalityResponses, 'Nonessential'),
        plannedAmount: sumCriticalityAmountAcrossPeriods(criticalityResponses, 'Planned'),
      }
    },
    enabled: Boolean(account && account.trim() && allStatementPeriods.length > 0),
    placeholderData: (previous) => previous,
  })

  return {
    ...query,
    data: query.data ?? ranges.map((range) => toTrendPoint(range, undefined, undefined)),
    allTimeTotals: allTimeCriticalityTotals.data ?? {
      essentialAmount: 0,
      nonessentialAmount: 0,
      plannedAmount: 0,
    },
  }
}
