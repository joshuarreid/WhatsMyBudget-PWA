import { describe, expect, it } from 'vitest'
import {
  buildLastSixMonthRanges,
  buildMonthlySpendingTrendStats,
  sumCriticalityAmount,
  sumCriticalityAmountAcrossPeriods,
} from './monthlySpendingTrend'

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
      { statementPeriod: 'JANUARY2026', label: 'Jan 2026', startDate: '2026-01-01', endDate: '2026-01-31', totalAmount: 100, transactionCount: 2, essentialAmount: 40, nonessentialAmount: 50, plannedAmount: 10 },
      { statementPeriod: 'FEBRUARY2026', label: 'Feb 2026', startDate: '2026-02-01', endDate: '2026-02-28', totalAmount: 150, transactionCount: 3, essentialAmount: 70, nonessentialAmount: 60, plannedAmount: 20 },
      { statementPeriod: 'MARCH2026', label: 'Mar 2026', startDate: '2026-03-01', endDate: '2026-03-31', totalAmount: 120, transactionCount: 1, essentialAmount: 50, nonessentialAmount: 50, plannedAmount: 20 },
    ])

    expect(stats.totalAmount).toBe(370)
    expect(stats.monthlyAverage).toBeCloseTo(123.33333333333333)
    expect(stats.essentialAverage).toBeCloseTo(53.333333333333336)
    expect(stats.nonessentialAverage).toBeCloseTo(53.333333333333336)
    expect(stats.trendAmount).toBe(20)
    expect(stats.trendPercent).toBeCloseTo(5.405405405405405)
    expect(stats.trend).toBe('growing')
  })

  it('sums criticality amounts regardless of label casing', () => {
    expect(
      sumCriticalityAmount(
        [
          { criticality: 'essential', totalAmount: 40 },
          { criticality: ' Essential ', totalAmount: 10 },
          { criticality: 'PLANNED', totalAmount: 15 },
        ],
        'Essential'
      )
    ).toBe(50)

    expect(
      sumCriticalityAmount(
        [
          { criticality: 'nonessential', totalAmount: 20 },
          { criticality: 'Nonessential', totalAmount: 5 },
        ],
        'Nonessential'
      )
    ).toBe(25)
  })

  it('sums criticality amounts across all periods', () => {
    expect(
      sumCriticalityAmountAcrossPeriods(
        [
          [
            { criticality: 'Essential', totalAmount: 10 },
            { criticality: 'Nonessential', totalAmount: 20 },
          ],
          [
            { criticality: 'nonessential', totalAmount: 30 },
            { criticality: 'Planned', totalAmount: 40 },
          ],
        ],
        'Nonessential'
      )
    ).toBe(50)
  })
})
