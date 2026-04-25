import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { criticalitySummaryQueryKeys } from '../../../api/transactions/criticalitySummaryQueryKeys'
import { fetchAccountTransactionsByCriticality, buildCriticalitySummary } from '../../../api/transactions/criticalitySummary'
import type { CriticalitySummary } from '../../../api/transactions/criticalitySummary.types'
import { useProjectedTransactions } from '../../projectedTransactions/hooks/useProjectedTransactions'

export type CriticalitySummaries = {
  essential: CriticalitySummary
  nonessential: CriticalitySummary
}

export const useCriticalitySummaries = (account?: string, statementPeriod?: string) => {
  const enabled = Boolean(account && account.trim().length > 0 && statementPeriod && statementPeriod.trim().length > 0)

  // projected transactions (single call) and filter by criticality client-side
  const projectedQuery = useProjectedTransactions(account, statementPeriod ? { statementPeriod } : undefined)
  const projectedList = (projectedQuery.data?.projectedTransactions ?? projectedQuery.data?.transactions ?? []) as any[]

  const essentialProjected = useMemo(
    () => projectedList.filter((t) => String((t as any).criticality ?? '').toLowerCase() === 'essential'),
    [projectedList]
  )
  const nonessentialProjected = useMemo(
    () => projectedList.filter((t) => String((t as any).criticality ?? '').toLowerCase() === 'nonessential'),
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

  const data: CriticalitySummaries | undefined = useMemo(() => {
    if (!enabled) return undefined
    const essentialActual = essentialActualQuery.data ?? []
    const nonessentialActual = nonessentialActualQuery.data ?? []

    return {
      essential: buildCriticalitySummary({ actual: essentialActual as any, projected: essentialProjected as any }),
      nonessential: buildCriticalitySummary({ actual: nonessentialActual as any, projected: nonessentialProjected as any }),
    }
  }, [
    enabled,
    essentialActualQuery.data,
    nonessentialActualQuery.data,
    essentialProjected,
    nonessentialProjected,
  ])

  return {
    data,
    isPending:
      projectedQuery.isPending || essentialActualQuery.isPending || nonessentialActualQuery.isPending,
    isError: projectedQuery.isError || essentialActualQuery.isError || nonessentialActualQuery.isError,
    error: projectedQuery.error ?? essentialActualQuery.error ?? nonessentialActualQuery.error,
  }
}
