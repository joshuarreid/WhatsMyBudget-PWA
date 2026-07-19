import type { CriticalitySummaries } from '@/features/transactions/hooks/useCriticalitySummaries'
import type { CriticalitySummary } from '@/features/transactions/api/criticalitySummary.types'

export type PlanningAccount = 'josh' | 'anna' | 'joint'
export type PlanningMetric = 'planned' | 'essential' | 'nonessential'
export type SummaryCell = {
  actual: number
  projected: number
  total: number
}

export type PlanningSummaryRow = {
  metric: PlanningMetric
  label: string
  byAccount: Record<PlanningAccount, SummaryCell>
}

export type PlanningTopSummaryModel = {
  accounts: PlanningAccount[]
  rows: PlanningSummaryRow[]
}

const ACCOUNT_ORDER: PlanningAccount[] = ['josh', 'anna', 'joint']
const METRIC_META: Array<{ metric: PlanningMetric; label: string }> = [
  { metric: 'planned', label: 'Planned' },
  { metric: 'essential', label: 'Essential' },
  { metric: 'nonessential', label: 'Nonessential' },
]

const toCell = (summary?: CriticalitySummary): SummaryCell => {
  const actual = summary?.actualTotal ?? 0
  const projected = summary?.projectedTotal ?? 0
  return { actual, projected, total: actual + projected }
}

export const buildPlanningTopSummaryModel = (args: {
  josh?: CriticalitySummaries
  anna?: CriticalitySummaries
  joint?: CriticalitySummaries
}): PlanningTopSummaryModel => {
  const byAccount: Record<PlanningAccount, CriticalitySummaries | undefined> = {
    josh: args.josh,
    anna: args.anna,
    joint: args.joint,
  }

  return {
    accounts: ACCOUNT_ORDER,
    rows: METRIC_META.map(({ metric, label }) => ({
      metric,
      label,
      byAccount: {
        josh: toCell(byAccount.josh?.[metric]),
        anna: toCell(byAccount.anna?.[metric]),
        joint: toCell(byAccount.joint?.[metric]),
      },
    })),
  }
}

