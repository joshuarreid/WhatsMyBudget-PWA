import { transactionsApiClient } from './transactionsApiClient'
import type { ProjectedTransaction } from '../projectedTransactions/projectedTransactions.types'
import type { BudgetTransaction } from './transactions.types'
import type {
  CriticalitySummary,
  TransactionsAccountCriticalityResponse,
} from './criticalitySummary.types'

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

const coerceAmount = (value: unknown): number => {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

const normalizeAccountKey = (account: string) => account.trim().toLowerCase()

const pickBucketTransactions = (account: string, data: TransactionsAccountCriticalityResponse): unknown[] => {
  const key = normalizeAccountKey(account)

  // Expected UX:
  // - For a person (josh/anna), show their personal + their share of joint (split) transactions.
  // - For the joint account, show only joint.
  if (key === 'joint') {
    return data.jointTransactions?.transactions ?? []
  }

  const personal = data.personalTransactions?.transactions ?? []
  const joint = data.jointTransactions?.transactions ?? []
  return [...personal, ...joint]
}

export const fetchAccountTransactionsByCriticality = async (params: {
  account: string
  statementPeriod: string
  criticality: 'essential' | 'nonessential'
}): Promise<BudgetTransaction[]> => {
  const q = new URLSearchParams({
    account: params.account,
    statementPeriod: params.statementPeriod,
    criticality: params.criticality,
  })

  // Note: endpoint intentionally uses /api/transactions (not /api/v2/transactions)
  const url = `/api/transactions/account?${q.toString()}`
  const res = await transactionsApiClient.get<TransactionsAccountCriticalityResponse>(url)
  return pickBucketTransactions(params.account, res.data) as BudgetTransaction[]
}

export const buildCriticalitySummary = (args: {
  actual: BudgetTransaction[]
  projected: ProjectedTransaction[]
}): CriticalitySummary => {
  const actualTotal = sum(args.actual.map((t: BudgetTransaction) => coerceAmount(t.amount)))
  const projectedTotal = sum(args.projected.map((t: ProjectedTransaction) => coerceAmount(t.amount)))

  return {
    actualCount: args.actual.length,
    projectedCount: args.projected.length,
    actualTotal,
    projectedTotal,
  }
}
