import { useQuery } from '@tanstack/react-query'
import { analyticsQueryKeys } from '@/api/analytics/analyticsQueryKeys.ts'
import { fetchAnalyticsPeriodOverview } from '@/api/analytics/analytics.ts'

export const useCurrentMonthSpendingTrend = (account: string, period: string) => {
  return useQuery({
    queryKey: analyticsQueryKeys.periodOverview(period, account),
    queryFn: () => fetchAnalyticsPeriodOverview(period, { account }),
    enabled: Boolean(account && account.trim() && period && period.trim()),
    placeholderData: (previous) => previous,
  })
}
