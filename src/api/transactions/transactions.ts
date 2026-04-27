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
  const normalizedData = data as Partial<AccountBudgetTransactionList> & {
    personalTransactions?: { transactions?: BudgetTransaction[]; count?: number; total?: number }
    jointTransactions?: { transactions?: BudgetTransaction[]; count?: number; total?: number }
  }

  // Standard shape
  if (normalizedData && Array.isArray(normalizedData.transactions)) {
    return normalizedData as AccountBudgetTransactionList
  }

  // Aggregated shape: { personalTransactions, jointTransactions, ... }
  const mapKeyByAccount: Record<string, string> = {
    josh: 'personalTransactions',
    anna: 'personalTransactions',
    joint: 'jointTransactions',
  }

  // For personal accounts, merge both personal and joint transactions
  if (account === 'josh' || account === 'anna') {
    const personal = normalizedData?.personalTransactions?.transactions ?? []
    const joint = normalizedData?.jointTransactions?.transactions ?? []
    return {
      account,
      transactions: [...personal, ...joint],
      count: (normalizedData?.personalTransactions?.count ?? personal.length) + (normalizedData?.jointTransactions?.count ?? joint.length),
      total: (normalizedData?.personalTransactions?.total ?? 0) + (normalizedData?.jointTransactions?.total ?? 0),
    }
  }

  const bucketKey = mapKeyByAccount[account] ?? ''
  // normalizedData doesn't have a string index signature; use unknown and narrow safely
  const bucket = bucketKey ? (normalizedData as Record<string, unknown>)?.[bucketKey] : undefined

  // Narrow bucket to the expected shape: an object with an array `transactions` field
  if (
    bucket &&
    typeof bucket === 'object' &&
    bucket !== null &&
    'transactions' in bucket &&
    Array.isArray((bucket as { transactions?: unknown }).transactions)
  ) {
    const b = bucket as { transactions?: BudgetTransaction[]; count?: number; total?: number }
    return {
      account,
      transactions: b.transactions ?? [],
      count: typeof b.count === 'number' ? b.count : (b.transactions ?? []).length,
      total: typeof b.total === 'number' ? b.total : 0,
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
