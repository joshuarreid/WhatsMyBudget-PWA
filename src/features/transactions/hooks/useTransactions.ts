import { useQuery } from '@tanstack/react-query'
import { fetchAccountTransactions } from '../api/transactions.ts'
import { transactionsQueryKeys } from '../api/transactionsQueryKeys.ts'
import type { TransactionFilters } from '../api/transactions.types.ts'

export const useTransactions = (account?: string, filters?: Omit<TransactionFilters, 'account'>) => {
  const statementPeriod = filters?.statementPeriod

  return useQuery({
    queryKey: account ? transactionsQueryKeys.account(account, filters) : transactionsQueryKeys.list(filters),
    queryFn: () => {
      if (!account) throw new Error('Account is required')
      return fetchAccountTransactions(account, filters)
    },
    enabled: Boolean(account && account.trim().length > 0 && statementPeriod && String(statementPeriod).trim().length > 0),
  })
}
