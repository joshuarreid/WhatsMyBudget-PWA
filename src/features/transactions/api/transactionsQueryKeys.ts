import type { TransactionFilters } from './transactions.types.ts'

export const transactionsQueryKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionsQueryKeys.all, 'list'] as const,
  list: (filters?: TransactionFilters) => [...transactionsQueryKeys.lists(), filters] as const,
  details: () => [...transactionsQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionsQueryKeys.details(), id] as const,
  account: (account: string, filters?: Omit<TransactionFilters, 'account'>) =>
    [...transactionsQueryKeys.all, 'account', account, filters] as const,
}
