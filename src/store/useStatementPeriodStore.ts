import { create } from 'zustand'
import { updateCurrentStatementPeriod } from '../api/cache/cache'

type SetSelectedPeriodOptions = {
  persist?: boolean
}

export type StatementPeriodStoreState = {
  selectedPeriod: string
  setSelectedPeriod: (period: string, options?: SetSelectedPeriodOptions) => void
  availablePeriods: string[]
  setAvailablePeriods: (periods: string[]) => void
  loading: boolean
  setLoading: (loading: boolean) => void
  error: boolean
  setError: (error: boolean) => void
}

export const useStatementPeriodStore = create<StatementPeriodStoreState>((set) => ({
  selectedPeriod: '',
  setSelectedPeriod: (period, options) => {
    set({ selectedPeriod: period })

    if (options?.persist === false) return

    void updateCurrentStatementPeriod(period).catch((error) => {
      console.error('Failed to persist current statement period', error)
    })
  },
  availablePeriods: [],
  setAvailablePeriods: (periods) => set({ availablePeriods: periods }),
  loading: false,
  setLoading: (loading) => set({ loading }),
  error: false,
  setError: (error) => set({ error }),
}))
