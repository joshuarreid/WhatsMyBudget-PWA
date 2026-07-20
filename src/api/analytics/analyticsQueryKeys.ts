import type { AnalyticsRangeOverviewParams } from './analytics.types.ts'

const rangeOverviewKey = (params: AnalyticsRangeOverviewParams) => [
  'analytics',
  'range',
  'overview',
  params.startDate,
  params.endDate,
  params.account ?? '',
  params.paymentMethod ?? '',
]

export const analyticsQueryKeys = {
  all: ['analytics'] as const,
  rangeOverview: rangeOverviewKey,
  periodOverview: (period: string, account?: string, paymentMethod?: string) => [
    'analytics',
    'period',
    'overview',
    period,
    account ?? '',
    paymentMethod ?? '',
  ] as const,
  periodCriticality: (period: string, account?: string, paymentMethod?: string) => [
    'analytics',
    'period',
    'criticality',
    period,
    account ?? '',
    paymentMethod ?? '',
  ] as const,
}
