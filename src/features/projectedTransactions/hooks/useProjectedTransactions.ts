import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchAccountProjectedTransactions,
  createProjectedTransaction,
  updateProjectedTransaction,
  deleteProjectedTransaction,
} from '../../../api/projectedTransactions/projectedTransactions'
import { projectedTransactionsQueryKeys } from '../../../api/projectedTransactions/projectedTransactionsQueryKeys'
import type {
  ProjectedTransactionFilters,
  ProjectedTransaction,
} from '../../../api/projectedTransactions/projectedTransactions.types'

export const useProjectedTransactions = (
  account?: string,
  filters?: Omit<ProjectedTransactionFilters, 'account'>
) => {
  const statementPeriod = filters?.statementPeriod

  return useQuery({
    queryKey: account
      ? projectedTransactionsQueryKeys.account(account, filters)
      : projectedTransactionsQueryKeys.list(filters),
    queryFn: () => {
      if (!account) throw new Error('Account is required')
      return fetchAccountProjectedTransactions(account, filters)
    },
    enabled: Boolean(account && account.trim().length > 0 && statementPeriod && String(statementPeriod).trim().length > 0),
  })
}

export const useCreateProjectedTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createProjectedTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectedTransactionsQueryKeys.all })
    },
  })
}

export const useUpdateProjectedTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectedTransaction }) =>
      updateProjectedTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectedTransactionsQueryKeys.all })
    },
  })
}

export const useDeleteProjectedTransaction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteProjectedTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectedTransactionsQueryKeys.all })
    },
  })
}
