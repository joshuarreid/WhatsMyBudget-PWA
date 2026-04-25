import { cacheApiClient, cacheBasePath } from './cacheApiClient'
import type { CurrentStatementPeriodResponse } from './cache.types'

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const fetchCurrentStatementPeriod = async (): Promise<CurrentStatementPeriodResponse> => {
  // The cache endpoint may return either a raw string ("APRIL2026") or an object.
  const response = await cacheApiClient.get<unknown>(`${cacheBasePath}/currentStatementPeriod`)

  const data = response.data

  if (typeof data === 'string') {
    return { statementPeriod: data }
  }

  if (isObject(data)) {
    // Preferred/newer shapes
    const raw = data.statementPeriod
    if (typeof raw === 'string') {
      return { statementPeriod: raw }
    }

    const period = data.currentStatementPeriod
    if (typeof period === 'string') {
      return { statementPeriod: period }
    }

    // Legacy cache row shape
    const cacheValue = data.cacheValue
    if (typeof cacheValue === 'string') {
      return { statementPeriod: cacheValue }
    }
  }

  throw new Error('Unexpected response shape from /api/cache/currentStatementPeriod')
}
