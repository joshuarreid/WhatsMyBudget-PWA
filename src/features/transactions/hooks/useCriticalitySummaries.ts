import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { criticalitySummaryQueryKeys } from '../api/criticalitySummaryQueryKeys.ts'
import { fetchAccountTransactionsByCriticality, buildCriticalitySummary } from '../api/criticalitySummary.ts'
import type { CriticalitySummary } from '../api/criticalitySummary.types.ts'
import { useProjectedTransactions } from '../../projectedTransactions/hooks/useProjectedTransactions'
import type { BudgetTransaction } from '../api/transactions.types.ts'
import type { ProjectedTransaction } from '../../projectedTransactions/api/projectedTransactions.types.ts'

export type CriticalitySummaries = {
  planned: CriticalitySummary
  essential: CriticalitySummary
  nonessential: CriticalitySummary
}

export type CategoryBreakdownRow = {
  category: string
  actualTotal: number
  projectedTotal: number
}

export type CriticalitySummaryDetails = {
  summaries: CriticalitySummaries
  essential: {
    actual: BudgetTransaction[]
    projected: ProjectedTransaction[]
    byCategory: CategoryBreakdownRow[]
  }
  nonessential: {
    actual: BudgetTransaction[]
    projected: ProjectedTransaction[]
    byCategory: CategoryBreakdownRow[]
  }
}

const coerceAmount = (value: unknown): number => {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

const getCriticalityId = (txn: ProjectedTransaction): number | undefined => {
  const rawId = (txn as { criticality_id?: unknown }).criticality_id
  const parsedId = typeof rawId === 'number' ? rawId : Number(rawId)
  if (Number.isFinite(parsedId)) return parsedId

  // Backward-compatible fallback for payloads that still send string criticality.
  const rawCriticality = (txn as { criticality?: unknown }).criticality
  const normalized = String(rawCriticality ?? '').trim().toLowerCase()
  if (normalized === 'essential') return 1
  if (normalized === 'nonessential') return 2
  if (normalized === 'planned') return 3
  return undefined
}

const buildByCategory = (args: {
  actual: BudgetTransaction[]
  projected: ProjectedTransaction[]
}): CategoryBreakdownRow[] => {
  const map = new Map<string, { actualTotal: number; projectedTotal: number }>()

  for (const t of args.actual) {
    const category = String(t.category ?? 'Uncategorized').trim() || 'Uncategorized'
    const prev = map.get(category) ?? { actualTotal: 0, projectedTotal: 0 }
    map.set(category, { ...prev, actualTotal: prev.actualTotal + coerceAmount(t.amount) })
  }

  for (const t of args.projected) {
    const category = String(t.category ?? 'Uncategorized').trim() || 'Uncategorized'
    const prev = map.get(category) ?? { actualTotal: 0, projectedTotal: 0 }
    map.set(category, { ...prev, projectedTotal: prev.projectedTotal + coerceAmount(t.amount) })
  }

  return Array.from(map.entries())
    .map(([category, totals]) => ({ category, ...totals }))
    .sort((a, b) => {
      const aTotal = a.actualTotal + a.projectedTotal
      const bTotal = b.actualTotal + b.projectedTotal
      // Desc by total, then alpha
      if (bTotal !== aTotal) return bTotal - aTotal
      return a.category.localeCompare(b.category)
    })
}

export const useCriticalitySummaries = (account?: string, statementPeriod?: string) => {
  const enabled = Boolean(account && account.trim().length > 0 && statementPeriod && statementPeriod.trim().length > 0)

  // projected transactions (single call) and filter by criticality client-side
  const projectedQuery = useProjectedTransactions(account, statementPeriod ? { statementPeriod } : undefined)
  const projectedList = useMemo(() => (
    projectedQuery.data?.projectedTransactions ?? projectedQuery.data?.transactions ?? []
  ), [projectedQuery.data]) as ProjectedTransaction[]

  const essentialProjected = useMemo(
    () => projectedList.filter((t) => getCriticalityId(t) === 1),
    [projectedList]
  )
  const plannedProjected = useMemo(
    () => projectedList.filter((t) => getCriticalityId(t) === 3),
    [projectedList]
  )
  const nonessentialProjected = useMemo(
    () => projectedList.filter((t) => getCriticalityId(t) === 2),
    [projectedList]
  )

  const essentialActualQuery = useQuery({
    queryKey:
      account && statementPeriod
        ? [...criticalitySummaryQueryKeys.byAccountAndPeriod(account, statementPeriod), 'essential']
        : criticalitySummaryQueryKeys.all,
    queryFn: () => {
      if (!account || !statementPeriod) throw new Error('account and statementPeriod are required')
      return fetchAccountTransactionsByCriticality({ account, statementPeriod, criticality: 'essential' })
    },
    enabled,
  })

  const nonessentialActualQuery = useQuery({
    queryKey:
      account && statementPeriod
        ? [...criticalitySummaryQueryKeys.byAccountAndPeriod(account, statementPeriod), 'nonessential']
        : criticalitySummaryQueryKeys.all,
    queryFn: () => {
      if (!account || !statementPeriod) throw new Error('account and statementPeriod are required')
      return fetchAccountTransactionsByCriticality({ account, statementPeriod, criticality: 'nonessential' })
    },
    enabled,
  })

  const plannedActualQuery = useQuery({
    queryKey:
      account && statementPeriod
        ? [...criticalitySummaryQueryKeys.byAccountAndPeriod(account, statementPeriod), 'planned']
        : criticalitySummaryQueryKeys.all,
    queryFn: async () => {
      if (!account || !statementPeriod) throw new Error('account and statementPeriod are required')
      // Some environments may not yet expose the planned bucket endpoint.
      // Fall back to no actual planned transactions instead of failing the whole widget.
      try {
        return await fetchAccountTransactionsByCriticality({ account, statementPeriod, criticality: 'planned' })
      } catch {
        return []
      }
    },
    enabled,
  })

  const data: CriticalitySummaryDetails | undefined = useMemo(() => {
    if (!enabled) return undefined
    const essentialActual = (essentialActualQuery.data ?? []) as BudgetTransaction[]
    const nonessentialActual = (nonessentialActualQuery.data ?? []) as BudgetTransaction[]
    const plannedActual = (plannedActualQuery.data ?? []) as BudgetTransaction[]
    const plannedSummary = buildCriticalitySummary({ actual: plannedActual, projected: plannedProjected })

    const essentialSummary = buildCriticalitySummary({ actual: essentialActual, projected: essentialProjected })
    const nonessentialSummary = buildCriticalitySummary({ actual: nonessentialActual, projected: nonessentialProjected })

    return {
      summaries: {
        planned: plannedSummary,
        essential: essentialSummary,
        nonessential: nonessentialSummary,
      },
      essential: {
        actual: essentialActual,
        projected: essentialProjected as ProjectedTransaction[],
        byCategory: buildByCategory({ actual: essentialActual, projected: essentialProjected as ProjectedTransaction[] }),
      },
      nonessential: {
        actual: nonessentialActual,
        projected: nonessentialProjected as ProjectedTransaction[],
        byCategory: buildByCategory({ actual: nonessentialActual, projected: nonessentialProjected as ProjectedTransaction[] }),
      },
    }
  }, [
    enabled,
    essentialActualQuery.data,
    nonessentialActualQuery.data,
    plannedActualQuery.data,
    essentialProjected,
    plannedProjected,
    nonessentialProjected,
  ])

  return {
    data,
    isPending:
      projectedQuery.isPending || essentialActualQuery.isPending || nonessentialActualQuery.isPending || plannedActualQuery.isPending,
    isError: projectedQuery.isError || essentialActualQuery.isError || nonessentialActualQuery.isError,
    error: projectedQuery.error ?? essentialActualQuery.error ?? nonessentialActualQuery.error,
  }
}
