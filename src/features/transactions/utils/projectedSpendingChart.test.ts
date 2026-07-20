import { describe, expect, it } from 'vitest'
import type { ProjectedTransaction } from '@/features/projectedTransactions/api/projectedTransactions.types.ts'
import { buildProjectedSpendingChartData } from './projectedSpendingChart'

describe('buildProjectedSpendingChartData', () => {
  it('groups projected transactions by statement period and criticality', () => {
    const transactions: ProjectedTransaction[] = [
      { statementPeriod: 'MARCH2026', criticality_id: 2, amount: 75, account: 'josh', category: 'Groceries', paymentMethod: 'Cash', projectedDate: '2026-03-31' },
      { statementPeriod: 'FEBRUARY2026', criticality_id: 1, amount: 100, account: 'josh', category: 'Rent', paymentMethod: 'Cash', projectedDate: '2026-02-28' },
      { statementPeriod: 'MARCH2026', criticality_id: 1, amount: 50, account: 'josh', category: 'Utilities', paymentMethod: 'Cash', projectedDate: '2026-03-31' },
      { statementPeriod: 'MARCH2026', criticality_id: 3, amount: 999, account: 'josh', category: 'Planned', paymentMethod: 'Cash', projectedDate: '2026-03-31' },
      { statementPeriod: 'INVALID', criticality_id: 1, amount: 10, account: 'josh', category: 'Rent', paymentMethod: 'Cash', projectedDate: '2026-01-31' },
    ]

    const result = buildProjectedSpendingChartData(transactions)

    expect(result).toEqual([
      {
        statementPeriod: 'FEBRUARY2026',
        monthLabel: expect.any(String),
        essentialAmount: 100,
        nonessentialAmount: 0,
        totalAmount: 100,
      },
      {
        statementPeriod: 'MARCH2026',
        monthLabel: expect.any(String),
        essentialAmount: 50,
        nonessentialAmount: 75,
        totalAmount: 125,
      },
    ])
  })

  it('returns an empty list when there are no essential or nonessential projected transactions', () => {
    const transactions: ProjectedTransaction[] = [
      { statementPeriod: 'MARCH2026', criticality_id: 3, amount: 75, account: 'josh', category: 'Planned', paymentMethod: 'Cash', projectedDate: '2026-03-31' },
    ]

    const result = buildProjectedSpendingChartData(transactions)

    expect(result).toEqual([])
  })
})
