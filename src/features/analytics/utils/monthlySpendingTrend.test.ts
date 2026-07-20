import { describe, expect, it } from 'vitest'
import { buildLastSixMonthRanges, buildMonthlySpendingTrendStats } from './monthlySpendingTrend'

describe('buildLastSixMonthRanges', () => {
  it('returns the previous six full months in calendar order', () => {
    const referenceDate = new Date('2026-07-20T12:00:00.000Z')

    expect(buildLastSixMonthRanges(referenceDate)).toEqual([
      { statementPeriod: 'JANUARY2026', label: 'Jan 2026', startDate: '2026-01-01', endDate: '2026-01-31' },
      { statementPeriod: 'FEBRUARY2026', label: 'Feb 2026', startDate: '2026-02-01', endDate: '2026-02-28' },
      { statementPeriod: 'MARCH2026', label: 'Mar 2026', startDate: '2026-03-01', endDate: '2026-03-31' },
      { statementPeriod: 'APRIL2026', label: 'Apr 2026', startDate: '2026-04-01', endDate: '2026-04-30' },
      { statementPeriod: 'MAY2026', label: 'May 2026', startDate: '2026-05-01', endDate: '2026-05-31' },
      { statementPeriod: 'JUNE2026', label: 'Jun 2026', startDate: '2026-06-01', endDate: '2026-06-30' },
    ])
  })

  it('builds summary stats from the month totals', () => {
    const stats = buildMonthlySpendingTrendStats([
      { statementPeriod: 'JANUARY2026', label: 'Jan 2026', startDate: '2026-01-01', endDate: '2026-01-31', totalAmount: 100, transactionCount: 2, essentialAmount: 40, nonessentialAmount: 60 },
      { statementPeriod: 'FEBRUARY2026', label: 'Feb 2026', startDate: '2026-02-01', endDate: '2026-02-28', totalAmount: 150, transactionCount: 3, essentialAmount: 70, nonessentialAmount: 80 },
      { statementPeriod: 'MARCH2026', label: 'Mar 2026', startDate: '2026-03-01', endDate: '2026-03-31', totalAmount: 120, transactionCount: 1, essentialAmount: 50, nonessentialAmount: 70 },
    ])

    expect(stats.totalAmount).toBe(370)
    expect(stats.monthlyAverage).toBeCloseTo(123.33333333333333)
    expect(stats.essentialAverage).toBeCloseTo(53.333333333333336)
    expect(stats.nonessentialAverage).toBeCloseTo(70)
    expect(stats.trendAmount).toBe(20)
    expect(stats.trendPercent).toBeCloseTo(20)
    expect(stats.trend).toBe('growing')
  })
})
