import { useMemo } from 'react'
import {
  useCriticalitySummaries,
} from '@/features/transactions/hooks/useCriticalitySummaries'
import { buildPlanningTopSummaryModel } from './planningTopSummaryModel'
export type {
  PlanningAccount,
  PlanningMetric,
  SummaryCell,
  PlanningSummaryRow,
  PlanningTopSummaryModel,
} from './planningTopSummaryModel'

export const usePlanningTopSummaries = (statementPeriod?: string) => {
  const joshQuery = useCriticalitySummaries('josh', statementPeriod)
  const annaQuery = useCriticalitySummaries('anna', statementPeriod)
  const jointQuery = useCriticalitySummaries('joint', statementPeriod)

  const model = useMemo(
    () =>
      buildPlanningTopSummaryModel({
        josh: joshQuery.data?.summaries,
        anna: annaQuery.data?.summaries,
        joint: jointQuery.data?.summaries,
      }),
    [annaQuery.data?.summaries, jointQuery.data?.summaries, joshQuery.data?.summaries]
  )

  return {
    model,
    isPending: Boolean(statementPeriod) && (joshQuery.isPending || annaQuery.isPending || jointQuery.isPending),
    isError: joshQuery.isError || annaQuery.isError || jointQuery.isError,
    error: joshQuery.error ?? annaQuery.error ?? jointQuery.error,
  }
}
