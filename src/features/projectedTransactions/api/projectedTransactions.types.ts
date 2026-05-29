export interface ProjectedTransaction {
  id?: number
  statementPeriod: string
  account: string
  category: string
  criticality: string
  paymentMethod: string
  amount: number
  /** backend may use name */
  name?: string
  description?: string
  /** frontend display field; mapped to transactionDate for PUT requests */
  projectedDate: string
  /** backend PUT/POST payloads use transactionDate */
  transactionDate?: string
  /** some legacy servers may use projectedTransactionDate */
  projectedTransactionDate?: string
  /** required by backend model on PUT */
  createdTime?: string
  status?: string
}

export interface ProjectedTransactionList {
  projectedTransactions: ProjectedTransaction[]
  /** backend may use count */
  count?: number
  total: number
}

export interface AccountProjectedTransactionList {
  account: string
  projectedTransactions?: ProjectedTransaction[]
  /** legacy servers may use `transactions` instead of `projectedTransactions` */
  transactions?: ProjectedTransaction[]
  count?: number
  total: number
}

export interface ProjectedTransactionFilters {
  statementPeriod?: string
  account?: string
  category?: string
  criticality?: string
  paymentMethod?: string
}

export interface DeleteAllResponse {
  deletedCount: number
}
