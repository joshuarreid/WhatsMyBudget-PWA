import { beforeEach, describe, expect, it, vi } from 'vitest'

const updateCurrentStatementPeriodMock = vi.hoisted(() => vi.fn())

vi.mock('../api/cache/cache', () => ({
  updateCurrentStatementPeriod: updateCurrentStatementPeriodMock,
}))

import { useStatementPeriodStore } from './useStatementPeriodStore'

describe('useStatementPeriodStore', () => {
  beforeEach(() => {
    useStatementPeriodStore.setState({
      selectedPeriod: '',
      availablePeriods: [],
      loading: false,
      error: false,
    })
    updateCurrentStatementPeriodMock.mockReset()
    updateCurrentStatementPeriodMock.mockResolvedValue({ statementPeriod: 'MAY2026' })
  })

  it('persists selected period changes by default', () => {
    useStatementPeriodStore.getState().setSelectedPeriod('MAY2026')

    expect(useStatementPeriodStore.getState().selectedPeriod).toBe('MAY2026')
    expect(updateCurrentStatementPeriodMock).toHaveBeenCalledWith('MAY2026')
  })

  it('can skip persistence when requested', () => {
    useStatementPeriodStore.getState().setSelectedPeriod('APRIL2026', { persist: false })

    expect(useStatementPeriodStore.getState().selectedPeriod).toBe('APRIL2026')
    expect(updateCurrentStatementPeriodMock).not.toHaveBeenCalled()
  })
})
