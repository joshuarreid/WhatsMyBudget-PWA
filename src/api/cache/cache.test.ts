import { describe, expect, it, vi } from 'vitest'

const cacheApiClientMock = vi.hoisted(() => ({
  get: vi.fn(),
}))

vi.mock('./cacheApiClient', () => ({
  cacheApiClient: cacheApiClientMock,
  cacheBasePath: '/api/v2/cache',
}))

import { fetchCurrentStatementPeriod } from './cache'

describe('fetchCurrentStatementPeriod', () => {
  it('requests the v2 cache endpoint and normalizes string responses', async () => {
    cacheApiClientMock.get.mockResolvedValueOnce({ data: 'APRIL2026' })

    const result = await fetchCurrentStatementPeriod()

    expect(cacheApiClientMock.get).toHaveBeenCalledWith('/api/v2/cache/currentStatementPeriod')
    expect(result).toEqual({ statementPeriod: 'APRIL2026' })
  })
})

