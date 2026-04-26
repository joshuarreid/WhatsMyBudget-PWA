import { useMemo } from 'react'
import type { Week } from './useCalculateWeeks'

export function useWeeklyAverage(weeks: Week[]): number {
  return useMemo(() => {
    if (!weeks || weeks.length === 0) return 0
    const total = weeks.reduce((sum, w) => sum + w.totalAmount, 0)
    return total / weeks.length
  }, [weeks])
}

