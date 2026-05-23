export type Criticality = 'Essential' | 'Nonessential' | string

export interface TransactionsAccountCriticalityResponse {
  personalTransactions?: {
    transactions: unknown[]
    count: number
    total: number
  }
  jointTransactions?: {
    transactions: unknown[]
    count: number
    total: number
  }
  personalTotal?: number
  jointTotal?: number
  total?: number
}

export interface CriticalitySummary {
  /** actual count */
  actualCount: number
  /** projected count */
  projectedCount: number
  /** actual total amount */
  actualTotal: number
  /** projected total amount */
  projectedTotal: number
}

