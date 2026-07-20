export interface AnalyticsPeriodOverviewResponse {
  statementPeriod: string | null
  paymentMethod: string | null
  account: string | null
  totalAmount: number
  transactionCount: number
}

export interface AnalyticsRangeOverviewParams {
  startDate: string
  endDate: string
  account?: string
  paymentMethod?: string
}

export interface AnalyticsPeriodOverviewParams {
  account?: string
  paymentMethod?: string
}

export interface AnalyticsCriticalityBreakdownResponse {
  criticality: string
  totalAmount: number
  transactionCount: number
}

export interface AnalyticsPeriodCriticalityParams {
  account?: string
  paymentMethod?: string
}
