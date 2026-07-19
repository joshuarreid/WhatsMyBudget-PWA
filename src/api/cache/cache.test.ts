import { describe, expect, it, vi } from 'vitest'

const cacheApiClientMock = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
}))

vi.mock('./cacheApiClient', () => ({
  cacheApiClient: cacheApiClientMock,
  cacheBasePath: '/api/v2/cache',
}))

import { fetchCurrentStatementPeriod, updateCurrentStatementPeriod } from './cache'

describe('fetchCurrentStatementPeriod', () => {
  it('requests the v2 cache endpoint and normalizes string responses', async () => {
    cacheApiClientMock.get.mockResolvedValueOnce({ data: 'APRIL2026' })

    const result = await fetchCurrentStatementPeriod()

    expect(cacheApiClientMock.get).toHaveBeenCalledWith('/api/v2/cache/currentStatementPeriod')
    expect(result).toEqual({ statementPeriod: 'APRIL2026' })
  })
})

describe('updateCurrentStatementPeriod', () => {
  it('updates the v2 cache endpoint with the selected statement period', async () => {
    cacheApiClientMock.put.mockResolvedValueOnce({ data: { statementPeriod: 'MAY2026' } })

    await updateCurrentStatementPeriod('MAY2026')

    expect(cacheApiClientMock.put).toHaveBeenCalledWith('/api/v2/cache/currentStatementPeriod', {
      statementPeriod: 'MAY2026',
    })
  })
})
