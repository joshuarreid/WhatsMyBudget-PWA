import { projectedTransactionsApiClient } from './projectedTransactionsApiClient'
import type {
  ProjectedTransaction,
  ProjectedTransactionList,
  AccountProjectedTransactionList,
  ProjectedTransactionFilters,
  DeleteAllResponse,
} from './projectedTransactions.types'

const appendFilters = (params: URLSearchParams, filters?: object) => {
  if (!filters) return
  Object.entries(filters as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    const stringValue = String(value).trim()
    if (!stringValue) return
    params.append(key, stringValue)
  })
}

const normalizeProjectedTransactionList = (data: unknown): ProjectedTransactionList => {
  const anyData = data as any

  if (anyData && Array.isArray(anyData.projectedTransactions)) {
    return anyData as ProjectedTransactionList
  }

  // Legacy servers sometimes return projected txs under `transactions`.
  if (anyData && Array.isArray(anyData.transactions)) {
    const list = anyData.transactions as ProjectedTransaction[]
    return {
      projectedTransactions: list,
      total: typeof anyData.total === 'number' ? anyData.total : list.length,
      count: typeof anyData.count === 'number' ? anyData.count : list.length,
    }
  }

  // Account view may return just { account, projectedTransactions } without list metadata.
  if (anyData && Array.isArray(anyData.projectedTransactions)) {
    const list = anyData.projectedTransactions as ProjectedTransaction[]
    return { projectedTransactions: list, total: list.length, count: list.length }
  }

  // Fallback to empty but keep a stable shape.
  return { projectedTransactions: [], total: 0, count: 0 }
}

const normalizeAccountProjectedTransactionsResponse = (
  account: string,
  data: unknown
): AccountProjectedTransactionList => {
  const anyData = data as any

  // Standard shape
  if (anyData && Array.isArray(anyData.projectedTransactions)) {
    return anyData as AccountProjectedTransactionList
  }

  if (anyData && Array.isArray(anyData.transactions)) {
    // Legacy standard
    return {
      account,
      projectedTransactions: anyData.transactions as ProjectedTransaction[],
      count: typeof anyData.count === 'number' ? anyData.count : (anyData.transactions as any[]).length,
      total:
        typeof anyData.total === 'number'
          ? anyData.total
          : (anyData.transactions as any[]).reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
    }
  }

  // Aggregated shape: { personalTransactions, jointTransactions, ... }
  const key = String(account ?? '').trim().toLowerCase()

  const personalBucket = anyData?.personalTransactions
  const jointBucket = anyData?.jointTransactions

  const personalTxs = Array.isArray(personalBucket?.transactions) ? (personalBucket.transactions as ProjectedTransaction[]) : []
  const jointTxs = Array.isArray(jointBucket?.transactions) ? (jointBucket.transactions as ProjectedTransaction[]) : []

  const projectedTransactions: ProjectedTransaction[] = key === 'joint' ? jointTxs : [...personalTxs, ...jointTxs]

  return {
    account,
    projectedTransactions,
    count: projectedTransactions.length,
    total: projectedTransactions.reduce((sum, t) => sum + (Number((t as any).amount) || 0), 0),
  }
}

export const createProjectedTransaction = async (
  data: ProjectedTransaction
): Promise<ProjectedTransaction> => {
  const response = await projectedTransactionsApiClient.post<ProjectedTransaction>(
    projectedTransactionsApiClient.getBasePath(),
    data
  )
  return response.data
}

export const fetchProjectedTransactions = async (
  filters?: ProjectedTransactionFilters
): Promise<ProjectedTransactionList> => {
  const params = new URLSearchParams()
  appendFilters(params, filters)

  const queryString = params.toString()
  const url = queryString
    ? `${projectedTransactionsApiClient.getBasePath()}?${queryString}`
    : projectedTransactionsApiClient.getBasePath()

  const response = await projectedTransactionsApiClient.get<unknown>(url)
  return normalizeProjectedTransactionList(response.data)
}

export const fetchProjectedTransactionById = async (id: string): Promise<ProjectedTransaction> => {
  const response = await projectedTransactionsApiClient.get<ProjectedTransaction>(
    `${projectedTransactionsApiClient.getBasePath()}/${id}`
  )
  return response.data
}

export const updateProjectedTransaction = async (
  id: string,
  data: ProjectedTransaction
): Promise<ProjectedTransaction> => {
  const response = await projectedTransactionsApiClient.put<ProjectedTransaction>(
    `${projectedTransactionsApiClient.getBasePath()}/${id}`,
    data
  )
  return response.data
}

export const deleteProjectedTransaction = async (id: string): Promise<void> => {
  await projectedTransactionsApiClient.delete(`${projectedTransactionsApiClient.getBasePath()}/${id}`)
}

export const deleteAllProjectedTransactions = async (): Promise<DeleteAllResponse> => {
  const response = await projectedTransactionsApiClient.delete<DeleteAllResponse>(
    projectedTransactionsApiClient.getBasePath()
  )
  return response.data
}

export const fetchAccountProjectedTransactions = async (
  account: string,
  filters?: Omit<ProjectedTransactionFilters, 'account'>
): Promise<AccountProjectedTransactionList> => {
  const params = new URLSearchParams({ account })
  appendFilters(params, filters)

  const url = `${projectedTransactionsApiClient.getBasePath()}/account?${params.toString()}`

  const response = await projectedTransactionsApiClient.get<unknown>(url)
  return normalizeAccountProjectedTransactionsResponse(account, response.data)
}
