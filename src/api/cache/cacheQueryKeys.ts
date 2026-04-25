export const cacheQueryKeys = {
  all: ['cache'] as const,
  currentStatementPeriod: () => [...cacheQueryKeys.all, 'currentStatementPeriod'] as const,
}

