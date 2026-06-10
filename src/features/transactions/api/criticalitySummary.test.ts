import { describe, expect, it, vi } from 'vitest'

const transactionsApiClientMock = vi.hoisted(() => ({
  getBasePath: vi.fn(() => '/api/v2/transactions'),
  get: vi.fn(),
}))

vi.mock('./transactionsApiClient.ts', () => ({
  transactionsApiClient: transactionsApiClientMock,
}))

import { fetchAccountTransactionsByCriticality } from './criticalitySummary.ts'

describe('fetchAccountTransactionsByCriticality', () => {
  it('requests the v2 transactions account endpoint and merges personal plus joint transactions for personal accounts', async () => {
    transactionsApiClientMock.get.mockResolvedValueOnce({
      data: {
        personalTransactions: {
          transactions: [{ id: 1 }, { id: 2 }],
          count: 2,
          total: 30,
        },
        jointTransactions: {
          transactions: [{ id: 3 }],
          count: 1,
          total: 15,
        },
      },
    })

    const result = await fetchAccountTransactionsByCriticality({
      account: 'josh',
      statementPeriod: 'FEBRUARY2020',
      criticality: 'essential',
    })

    expect(transactionsApiClientMock.getBasePath).toHaveBeenCalledTimes(1)
    expect(transactionsApiClientMock.get).toHaveBeenCalledWith(
      '/api/v2/transactions/account?account=josh&statementPeriod=FEBRUARY2020&criticality=essential'
    )
    expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
  })

  it('returns only joint transactions for the joint account', async () => {
    transactionsApiClientMock.get.mockResolvedValueOnce({
      data: {
        personalTransactions: {
          transactions: [{ id: 1 }],
          count: 1,
          total: 10,
        },
        jointTransactions: {
          transactions: [{ id: 9 }, { id: 10 }],
          count: 2,
          total: 25,
        },
      },
    })

    const result = await fetchAccountTransactionsByCriticality({
      account: 'joint',
      statementPeriod: 'FEBRUARY2020',
      criticality: 'planned',
    })

    expect(transactionsApiClientMock.get).toHaveBeenCalledWith(
      '/api/v2/transactions/account?account=joint&statementPeriod=FEBRUARY2020&criticality=planned'
    )
    expect(result).toEqual([{ id: 9 }, { id: 10 }])
  })
})

