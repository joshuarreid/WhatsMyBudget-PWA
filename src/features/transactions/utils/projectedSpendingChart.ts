import { parseStatementPeriod, formatStatementPeriod } from '@/utils/statementPeriodWindow'
import type { ProjectedTransaction } from '@/features/projectedTransactions/api/projectedTransactions.types.ts'

export type ProjectedSpendingMonth = {
  statementPeriod: string
  monthLabel: string
  essentialAmount: number
  nonessentialAmount: number
  totalAmount: number
}

const coerceAmount = (value: unknown): number => {
  const amount = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(amount) ? amount : 0
}

const formatMonthLabel = (statementPeriod: string): string => {
  const parsed = parseStatementPeriod(statementPeriod)
  if (!parsed) return statementPeriod

  const date = new Date(parsed.year, parsed.monthIndex, 1)
  return new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' }).format(date)
}

const getCriticalityBucket = (transaction: ProjectedTransaction): 'essential' | 'nonessential' | null => {
  if (transaction.criticality_id === 1) return 'essential'
  if (transaction.criticality_id === 2) return 'nonessential'
  return null
}

export const buildProjectedSpendingChartData = (
  transactions: ProjectedTransaction[]
): ProjectedSpendingMonth[] => {
  const byPeriod = new Map<string, { essentialAmount: number; nonessentialAmount: number }>()

  for (const transaction of transactions ?? []) {
    const bucket = getCriticalityBucket(transaction)
    if (!bucket) continue

    const parsed = parseStatementPeriod(transaction.statementPeriod)
    if (!parsed) continue

    const statementPeriod = formatStatementPeriod(parsed.monthIndex, parsed.year)
    const prev = byPeriod.get(statementPeriod) ?? { essentialAmount: 0, nonessentialAmount: 0 }
    if (bucket === 'essential') {
      prev.essentialAmount += coerceAmount(transaction.amount)
    } else {
      prev.nonessentialAmount += coerceAmount(transaction.amount)
    }
    byPeriod.set(statementPeriod, prev)
  }

  return Array.from(byPeriod.entries())
    .map(([statementPeriod, totals]) => ({
      statementPeriod,
      monthLabel: formatMonthLabel(statementPeriod),
      essentialAmount: totals.essentialAmount,
      nonessentialAmount: totals.nonessentialAmount,
      totalAmount: totals.essentialAmount + totals.nonessentialAmount,
    }))
    .sort((a, b) => {
      const parsedA = parseStatementPeriod(a.statementPeriod)
      const parsedB = parseStatementPeriod(b.statementPeriod)
      const sortA = parsedA ? parsedA.year * 12 + parsedA.monthIndex : Number.MAX_SAFE_INTEGER
      const sortB = parsedB ? parsedB.year * 12 + parsedB.monthIndex : Number.MAX_SAFE_INTEGER
      if (sortA !== sortB) return sortA - sortB
      return a.statementPeriod.localeCompare(b.statementPeriod)
    })
}
