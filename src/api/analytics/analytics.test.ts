import { describe, expect, it, vi } from 'vitest'

const analyticsApiClientMock = vi.hoisted(() => ({
  get: vi.fn(),
}))

vi.mock('./analyticsApiClient', () => ({
  analyticsApiClient: analyticsApiClientMock,
  analyticsBasePath: '/api/v2/analytics',
}))

import { fetchAnalyticsRangeOverview, fetchAnalyticsPeriodOverview, fetchAnalyticsPeriodCriticality } from './analytics'

describe('fetchAnalyticsRangeOverview', () => {
  it('requests the analytics range overview endpoint with filters', async () => {
    analyticsApiClientMock.get.mockResolvedValueOnce({
      data: {
        statementPeriod: null,
        paymentMethod: null,
        account: 'josh',
        totalAmount: 123.45,
        transactionCount: 3,
      },
    })

    await fetchAnalyticsRangeOverview({
      startDate: '2026-02-01',
      endDate: '2026-02-28',
      account: 'josh',
    })

    expect(analyticsApiClientMock.get).toHaveBeenCalledWith(
      '/api/v2/analytics/range/overview?startDate=2026-02-01&endDate=2026-02-28&account=josh'
    )
  })
})

describe('fetchAnalyticsPeriodOverview', () => {
  it('requests the period overview endpoint with filters', async () => {
    analyticsApiClientMock.get.mockResolvedValueOnce({
      data: {
        statementPeriod: 'JULY2026',
        paymentMethod: null,
        account: 'josh',
        totalAmount: 222,
        transactionCount: 4,
      },
    })

    await fetchAnalyticsPeriodOverview('JULY2026', { account: 'josh' })

    expect(analyticsApiClientMock.get).toHaveBeenCalledWith(
      '/api/v2/analytics/periods/JULY2026/overview?account=josh'
    )
  })
})

describe('fetchAnalyticsPeriodCriticality', () => {
  it('requests the period criticality endpoint with filters', async () => {
    analyticsApiClientMock.get.mockResolvedValueOnce({
      data: [
        { criticality: 'Essential', totalAmount: 80, transactionCount: 2 },
        { criticality: 'Nonessential', totalAmount: 40, transactionCount: 1 },
      ],
    })

    await fetchAnalyticsPeriodCriticality('JULY2026', { account: 'josh' })

    expect(analyticsApiClientMock.get).toHaveBeenCalledWith(
      '/api/v2/analytics/periods/JULY2026/criticality?account=josh'
    )
  })
})
