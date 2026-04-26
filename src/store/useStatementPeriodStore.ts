import { create } from 'zustand'

export type StatementPeriodStoreState = {
  selectedPeriod: string
  setSelectedPeriod: (period: string) => void
  availablePeriods: string[]
  setAvailablePeriods: (periods: string[]) => void
  loading: boolean
  setLoading: (loading: boolean) => void
  error: boolean
  setError: (error: boolean) => void
}

export const useStatementPeriodStore = create<StatementPeriodStoreState>((set) => ({
  selectedPeriod: '',
  setSelectedPeriod: (period) => set({ selectedPeriod: period }),
  availablePeriods: [],
  setAvailablePeriods: (periods) => set({ availablePeriods: periods }),
  loading: false,
  setLoading: (loading) => set({ loading }),
  error: false,
  setError: (error) => set({ error }),
}))

