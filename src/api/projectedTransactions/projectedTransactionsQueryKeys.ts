import type { ProjectedTransactionFilters } from './projectedTransactions.types'

export const projectedTransactionsQueryKeys = {
  all: ['projectedTransactions'] as const,
  lists: () => [...projectedTransactionsQueryKeys.all, 'list'] as const,
  list: (filters?: ProjectedTransactionFilters) =>
    [...projectedTransactionsQueryKeys.lists(), filters] as const,
  details: () => [...projectedTransactionsQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectedTransactionsQueryKeys.details(), id] as const,
  account: (account: string, filters?: Omit<ProjectedTransactionFilters, 'account'>) =>
    [...projectedTransactionsQueryKeys.all, 'account', account, filters] as const,
}
