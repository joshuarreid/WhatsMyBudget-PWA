export interface BudgetTransaction {
  id: number
  statementPeriod: string
  account: string
  category: string
  criticality_id: number
  paymentMethod: string
  amount: number
  /** backend uses name; keep optional description for UI compatibility */
  name?: string
  description?: string
  /** backend uses transactionDate */
  transactionDate: string
  /** optional fields observed in responses */
  status?: string | null
  createdTime?: string
  rowHash?: string | null
}

export interface BudgetTransactionList {
  transactions: BudgetTransaction[]
  /** backend uses count */
  count: number
  /** backend uses total */
  total: number
}

export interface AccountBudgetTransactionList {
  account: string
  transactions: BudgetTransaction[]
  /** backend uses count */
  count: number
  total: number
  balance?: number
}

export interface TransactionFilters {
  statementPeriod?: string
  account?: string
  category?: string
  criticality_id?: number
  paymentMethod?: string
}
