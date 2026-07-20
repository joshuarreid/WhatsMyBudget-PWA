import { analyticsApiClient, analyticsBasePath } from './analyticsApiClient.ts'
import type {
  AnalyticsCriticalityBreakdownResponse,
  AnalyticsPeriodOverviewResponse,
  AnalyticsRangeOverviewParams,
  AnalyticsPeriodOverviewParams,
  AnalyticsPeriodCriticalityParams,
} from './analytics.types.ts'

const appendParams = (params: URLSearchParams, values: Record<string, string | undefined>) => {
  Object.entries(values).forEach(([key, value]) => {
    if (!value) return
    const trimmed = value.trim()
    if (!trimmed) return
    params.append(key, trimmed)
  })
}

export const fetchAnalyticsRangeOverview = async (
  params: AnalyticsRangeOverviewParams
): Promise<AnalyticsPeriodOverviewResponse> => {
  const searchParams = new URLSearchParams({
    startDate: params.startDate,
    endDate: params.endDate,
  })
  appendParams(searchParams, { account: params.account, paymentMethod: params.paymentMethod })

  const response = await analyticsApiClient.get<AnalyticsPeriodOverviewResponse>(
    `${analyticsBasePath}/range/overview?${searchParams.toString()}`
  )
  return response.data
}

export const fetchAnalyticsPeriodOverview = async (
  period: string,
  params: AnalyticsPeriodOverviewParams = {}
): Promise<AnalyticsPeriodOverviewResponse> => {
  const searchParams = new URLSearchParams()
  appendParams(searchParams, { account: params.account, paymentMethod: params.paymentMethod })

  const queryString = searchParams.toString()
  const response = await analyticsApiClient.get<AnalyticsPeriodOverviewResponse>(
    queryString
      ? `${analyticsBasePath}/periods/${period}/overview?${queryString}`
      : `${analyticsBasePath}/periods/${period}/overview`
  )
  return response.data
}

export const fetchAnalyticsPeriodCriticality = async (
  period: string,
  params: AnalyticsPeriodCriticalityParams = {}
): Promise<AnalyticsCriticalityBreakdownResponse[]> => {
  const searchParams = new URLSearchParams()
  appendParams(searchParams, { account: params.account, paymentMethod: params.paymentMethod })

  const queryString = searchParams.toString()
  const response = await analyticsApiClient.get<AnalyticsCriticalityBreakdownResponse[]>(
    queryString
      ? `${analyticsBasePath}/periods/${period}/criticality?${queryString}`
      : `${analyticsBasePath}/periods/${period}/criticality`
  )
  return response.data
}
