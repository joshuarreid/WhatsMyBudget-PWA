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
  projectedDate: string
  /** some legacy servers may use projectedTransactionDate */
  projectedTransactionDate?: string
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
