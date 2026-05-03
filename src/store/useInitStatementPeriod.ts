import { useEffect } from 'react'
import { useCurrentStatementPeriod } from '@/features/statements'
import { useStatementPeriodStore } from './useStatementPeriodStore'
import { buildStatementPeriodWindow } from '../utils/statementPeriodWindow'

export function useInitStatementPeriod() {
  const { data, isPending, isError } = useCurrentStatementPeriod()
  const setAvailablePeriods = useStatementPeriodStore((s) => s.setAvailablePeriods)
  const setSelectedPeriod = useStatementPeriodStore((s) => s.setSelectedPeriod)
  const setLoading = useStatementPeriodStore((s) => s.setLoading)
  const setError = useStatementPeriodStore((s) => s.setError)
  const selectedPeriod = useStatementPeriodStore((s) => s.selectedPeriod)

  useEffect(() => {
    setLoading(isPending)
    setError(isError)
    if (data?.statementPeriod) {
      const periods = buildStatementPeriodWindow(data.statementPeriod, { monthsBack: 6, monthsForward: 6 })
      setAvailablePeriods(periods)
      // Default to the current period (middle of the window)
      if (!selectedPeriod && periods.length > 0) {
        setSelectedPeriod(periods[6] ?? periods[periods.length - 1])
      }
    }
  }, [data, isPending, isError, setAvailablePeriods, setSelectedPeriod, setLoading, setError, selectedPeriod])
}
