export const criticalitySummaryQueryKeys = {
  all: ['criticalitySummary'] as const,
  byAccountAndPeriod: (account: string, statementPeriod: string) =>
    [...criticalitySummaryQueryKeys.all, account, statementPeriod] as const,
}

