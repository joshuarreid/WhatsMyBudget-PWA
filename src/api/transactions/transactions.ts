import { transactionsApiClient } from './transactionsApiClient'
import type {
  BudgetTransaction,
  BudgetTransactionList,
  AccountBudgetTransactionList,
  TransactionFilters,
} from './transactions.types'

const appendFilters = (params: URLSearchParams, filters?: object) => {
  if (!filters) return
  Object.entries(filters as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    const stringValue = String(value).trim()
    if (!stringValue) return
    params.append(key, stringValue)
  })
}

const normalizeAccountTransactionsResponse = (
  account: string,
  data: unknown
): AccountBudgetTransactionList => {
  const anyData = data as any

  // DEBUG: Log the raw API response for diagnosis
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.log('[normalizeAccountTransactionsResponse] account:', account, 'data:', anyData)
  }

  // Standard shape
  if (anyData && Array.isArray(anyData.transactions)) {
    return anyData as AccountBudgetTransactionList
  }

  // Aggregated shape: { personalTransactions, jointTransactions, ... }
  const mapKeyByAccount: Record<string, string> = {
    josh: 'personalTransactions',
    anna: 'personalTransactions',
    joint: 'jointTransactions',
  }

  // For personal accounts, merge both personal and joint transactions
  if (account === 'josh' || account === 'anna') {
    const personal = anyData?.personalTransactions?.transactions ?? []
    const joint = anyData?.jointTransactions?.transactions ?? []
    return {
      account,
      transactions: [...personal, ...joint],
      count: (anyData?.personalTransactions?.count ?? 0) + (anyData?.jointTransactions?.count ?? 0),
      total: (anyData?.personalTransactions?.total ?? 0) + (anyData?.jointTransactions?.total ?? 0),
    }
  }

  const bucketKey = mapKeyByAccount[account] ?? ''
  const bucket = bucketKey ? anyData?.[bucketKey] : undefined

  if (bucket && Array.isArray(bucket.transactions)) {
    return {
      account,
      transactions: bucket.transactions as BudgetTransaction[],
      count: typeof bucket.count === 'number' ? bucket.count : (bucket.transactions as any[]).length,
      total: typeof bucket.total === 'number' ? bucket.total : 0,
    }
  }

  // Fallback empty
  return { account, transactions: [], count: 0, total: 0 }
}

export const fetchTransactions = async (filters?: TransactionFilters): Promise<BudgetTransactionList> => {
  const params = new URLSearchParams()
  appendFilters(params, filters)

  const queryString = params.toString()
  const url = queryString
    ? `${transactionsApiClient.getBasePath()}?${queryString}`
    : transactionsApiClient.getBasePath()

  const response = await transactionsApiClient.get<BudgetTransactionList>(url)
  return response.data
}

export const fetchTransactionById = async (id: string): Promise<BudgetTransaction> => {
  const response = await transactionsApiClient.get<BudgetTransaction>(
    `${transactionsApiClient.getBasePath()}/${id}`
  )
  return response.data
}

export const fetchAccountTransactions = async (
  account: string,
  filters?: Omit<TransactionFilters, 'account'>
): Promise<AccountBudgetTransactionList> => {
  const params = new URLSearchParams({ account })
  appendFilters(params, filters)

  const url = `${transactionsApiClient.getBasePath()}/account?${params.toString()}`

  const response = await transactionsApiClient.get<unknown>(url)
  return normalizeAccountTransactionsResponse(account, response.data)
}
