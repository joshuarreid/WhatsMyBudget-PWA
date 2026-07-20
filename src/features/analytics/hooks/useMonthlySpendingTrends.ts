import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsQueryKeys } from '@/api/analytics/analyticsQueryKeys.ts'
import {
  fetchAnalyticsPeriodCriticality,
  fetchAnalyticsRangeOverview,
} from '@/api/analytics/analytics.ts'
import type { AnalyticsCriticalityBreakdownResponse, AnalyticsPeriodOverviewResponse } from '@/api/analytics/analytics.types.ts'
import { buildLastSixMonthRanges, type MonthlySpendingTrendPoint } from '../utils/monthlySpendingTrend'

const toTrendPoint = (
  range: ReturnType<typeof buildLastSixMonthRanges>[number],
  response: AnalyticsPeriodOverviewResponse | undefined,
  criticality: AnalyticsCriticalityBreakdownResponse[] | undefined
): MonthlySpendingTrendPoint => ({
  ...range,
  totalAmount: response?.totalAmount ?? 0,
  essentialAmount: criticality?.find((entry) => entry.criticality === 'Essential')?.totalAmount ?? 0,
  nonessentialAmount: criticality?.find((entry) => entry.criticality === 'Nonessential')?.totalAmount ?? 0,
  transactionCount: response?.transactionCount ?? 0,
})

export const useMonthlySpendingTrends = (account: string, monthCount: number) => {
  const ranges = useMemo(() => buildLastSixMonthRanges(undefined, monthCount), [monthCount])

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

  return {
    ...query,
    data: query.data ?? ranges.map((range) => toTrendPoint(range, undefined, undefined)),
  }
}
