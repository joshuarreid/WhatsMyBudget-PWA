import { cacheApiClient, cacheBasePath } from './cacheApiClient'
import type { CurrentStatementPeriodResponse } from './cache.types'

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const normalizeCurrentStatementPeriodResponse = (data: unknown): CurrentStatementPeriodResponse => {
  if (typeof data === 'string') {
    return { statementPeriod: data }
  }

  if (isObject(data)) {
    const raw = data.statementPeriod
    if (typeof raw === 'string') {
      return { statementPeriod: raw }
    }

    const period = data.currentStatementPeriod
    if (typeof period === 'string') {
      return { statementPeriod: period }
    }

    const cacheValue = data.cacheValue
    if (typeof cacheValue === 'string') {
      return { statementPeriod: cacheValue }
    }
  }

  throw new Error('Unexpected response shape from /api/cache/currentStatementPeriod')
}

export const fetchCurrentStatementPeriod = async (): Promise<CurrentStatementPeriodResponse> => {
  // The cache endpoint may return either a raw string ("APRIL2026") or an object.
  const response = await cacheApiClient.get<unknown>(`${cacheBasePath}/currentStatementPeriod`)
  return normalizeCurrentStatementPeriodResponse(response.data)
}

export const updateCurrentStatementPeriod = async (
  statementPeriod: string
): Promise<CurrentStatementPeriodResponse> => {
  const searchParams = new URLSearchParams({
    cacheKey: 'currentStatementPeriod',
    cacheValue: statementPeriod,
  })
  const response = await cacheApiClient.post<unknown>(`${cacheBasePath}?${searchParams.toString()}`)
  if (response.data == null || response.data === '') {
    return { statementPeriod }
  }
  return normalizeCurrentStatementPeriodResponse(response.data)
}
