import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '../layouts/MainLayout'
import { useTransactions } from '../features/transactions/hooks/useTransactions'
import { useProjectedTransactions } from '../features/projectedTransactions/hooks/useProjectedTransactions'
import { TransactionList } from '../features/transactions/components/TransactionList'
import { ProjectedTransactionList } from '../features/projectedTransactions/components/ProjectedTransactionList'
import { useCurrentStatementPeriod } from '../features/statements/hooks/useCurrentStatementPeriod'
import { useCriticalitySummaries } from '../features/transactions/hooks/useCriticalitySummaries'
import { CriticalitySummaryWidget } from '../features/transactions/components/CriticalitySummaryWidget'
import './DashboardPage.css'

const ACCOUNTS = ['josh', 'joint', 'anna'] as const

type Account = (typeof ACCOUNTS)[number]

const MONTHS = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
] as const

type MonthName = (typeof MONTHS)[number]

type ParsedStatementPeriod = {
  monthIndex: number
  year: number
}

const parseStatementPeriod = (period: string): ParsedStatementPeriod | null => {
  // Expected: MONTHYEAR (e.g. APRIL2026)
  const match = /^([A-Z]+)(\d{4})$/.exec(period.trim().toUpperCase())
  if (!match) return null

  const monthName = match[1] as MonthName
  const monthIndex = MONTHS.indexOf(monthName)
  if (monthIndex === -1) return null

  const year = Number(match[2])
  if (!Number.isFinite(year)) return null

  return { monthIndex, year }
}

const formatStatementPeriod = (monthIndex: number, year: number): string => {
  return `${MONTHS[monthIndex]}${year}`
}

const addMonths = (value: ParsedStatementPeriod, deltaMonths: number): ParsedStatementPeriod => {
  const total = value.year * 12 + value.monthIndex + deltaMonths
  const year = Math.floor(total / 12)
  const monthIndex = ((total % 12) + 12) % 12
  return { year, monthIndex }
}

const buildStatementPeriodWindow = (current: string | null | undefined): string[] => {
  if (!current) return []
  const parsed = parseStatementPeriod(current)
  if (!parsed) return []

  const periods: string[] = []
  for (let offset = -4; offset <= 6; offset++) {
    const p = addMonths(parsed, offset)
    periods.push(formatStatementPeriod(p.monthIndex, p.year))
  }

  return periods
}

export const DashboardPage = () => {
  const [selectedAccount, setSelectedAccount] = useState<Account>('josh')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')

  const {
    data: currentStatementPeriod,
    isPending: currentStatementPeriodLoading,
    isError: currentStatementPeriodError,
  } = useCurrentStatementPeriod()

  const availablePeriods = useMemo(() => {
    return buildStatementPeriodWindow(currentStatementPeriod?.statementPeriod)
  }, [currentStatementPeriod])

  useEffect(() => {
    if (selectedPeriod) return
    if (availablePeriods.length === 0) return
    setSelectedPeriod(availablePeriods[4])
  }, [selectedPeriod, availablePeriods])

  const filters = useMemo(() => {
    return selectedPeriod ? { statementPeriod: selectedPeriod } : undefined
  }, [selectedPeriod])

  const { data: transactions, isPending: transactionsLoading } = useTransactions(selectedAccount, filters)
  const { data: projectedTransactions, isPending: projectedLoading } = useProjectedTransactions(selectedAccount, filters)

  const {
    data: criticalitySummaries,
    isPending: criticalityPending,
    isError: criticalityError,
  } = useCriticalitySummaries(selectedAccount, selectedPeriod)

  const sortedActualTransactions = useMemo(() => {
    const list = transactions?.transactions ?? []
    return [...list].sort((a, b) => {
      const aDate = (a as any).date ?? a.transactionDate
      const bDate = (b as any).date ?? b.transactionDate
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })
  }, [transactions])

  const sortedProjectedTransactions = useMemo(() => {
    const list = projectedTransactions?.projectedTransactions ?? []
    return [...list].sort((a, b) => {
      const aDate =
        (a as any).projectedDate ?? (a as any).projectedTransactionDate ?? (a as any).transactionDate
      const bDate =
        (b as any).projectedDate ?? (b as any).projectedTransactionDate ?? (b as any).transactionDate
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })
  }, [projectedTransactions])

  return (
    <MainLayout>
      <div className="tt-card">
        <div className="tt-controls">
          <div>
            <div className="tt-tabs">
              {ACCOUNTS.map((acct) => {
                const isActive = selectedAccount === acct
                return (
                  <button
                    key={acct}
                    onClick={() => setSelectedAccount(acct)}
                    className={`tt-pill ${isActive ? 'tt-pill-active' : ''}`}
                    aria-label={`Select profile ${acct}`}
                  >
                    <span className="tt-pill-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M12 12c2.761 0 5-2.239 5-5S14.761 2 12 2 7 4.239 7 7s2.239 5 5 5Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M20 22a8 8 0 0 0-16 0"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="tt-pill-text">{acct}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="tt-period-controls">
            <label htmlFor="period-select" className="tt-label">
              Statement Period
            </label>

            {currentStatementPeriodLoading && <p className="tt-empty">Loading statement periods...</p>}
            {currentStatementPeriodError && (
              <p className="tt-error">Failed to load current statement period.</p>
            )}

            <select
              id="period-select"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="tt-select"
            >
              <option value="">All Periods</option>
              {availablePeriods.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedPeriod && (
          <div className="tt-subcard">
            {criticalityPending && <p className="tt-empty">Loading criticality summary...</p>}
            {criticalityError && (
              <p className="tt-error">Failed to load criticality summary.</p>
            )}
            {criticalitySummaries && (
              <CriticalitySummaryWidget
                account={selectedAccount}
                statementPeriod={selectedPeriod}
                essential={criticalitySummaries.essential}
                nonessential={criticalitySummaries.nonessential}
              />
            )}
          </div>
        )}

        <div className="tt-subcard">
          {/* Removed Projected Transactions section header */}
          {projectedLoading && <p className="tt-empty">Loading projected transactions...</p>}
          <div className="tt-body">
            {projectedTransactions ? (
              <ProjectedTransactionList transactions={sortedProjectedTransactions} />
            ) : (
              <div className="tt-empty" />
            )}
          </div>
        </div>

        <div className="tt-subcard">
          {/* Removed Transactions section header */}
          {transactionsLoading && <p className="tt-empty">Loading transactions...</p>}
          <div className="tt-body">
            {transactions ? (
              <TransactionList transactions={sortedActualTransactions} />
            ) : (
              <div className="tt-empty" />
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
