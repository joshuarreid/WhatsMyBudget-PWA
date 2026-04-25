import { useQuery } from '@tanstack/react-query'
import { fetchAccountTransactions } from '../../../api/transactions/transactions'
import { transactionsQueryKeys } from '../../../api/transactions/transactionsQueryKeys'
import type { TransactionFilters } from '../../../api/transactions/transactions.types'

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
