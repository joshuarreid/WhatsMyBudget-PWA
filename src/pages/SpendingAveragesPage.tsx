import { useEffect, useMemo, useState } from 'react'
import { MainLayout } from '../layouts/MainLayout'
import { useCurrentStatementPeriod } from '../features/statements/hooks/useCurrentStatementPeriod'
import { useTransactions } from '../features/transactions/hooks/useTransactions'
import { useCalculateWeeks } from '../features/transactions/hooks/useCalculateWeeks'
import { useWeeklyAverage } from '../features/transactions/hooks/useWeeklyAverage'
import './DashboardPage.css'
import { TransactionList } from '../features/transactions/components/TransactionList'

const ACCOUNTS = ['josh', 'joint', 'anna'] as const

type Account = (typeof ACCOUNTS)[number]

type ParsedStatementPeriod = {
  monthIndex: number
  year: number
}

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

const parseStatementPeriod = (period: string): ParsedStatementPeriod | null => {
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

const buildStatementPeriodWindow = (current: string | null | undefined, monthsBack: number): string[] => {
  if (!current) return []
  const parsed = parseStatementPeriod(current)
  if (!parsed) return []

  const periods: string[] = []
  for (let offset = -monthsBack; offset <= 0; offset++) {
    const p = addMonths(parsed, offset)
    periods.push(formatStatementPeriod(p.monthIndex, p.year))
  }

  return periods
}

// Utility functions for metrics
function formatMoney(amount: number) {
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

type MetricKey = 'food' | 'gas' | 'social' | 'nonperishables'

function classifyMetric(category: string): MetricKey | null {
  const cat = category.toLowerCase()
  if (cat.includes('gas')) return 'gas'
  if (cat.includes('food')) return 'food'
  if (cat.includes('social')) return 'social'
  if (cat.includes('nonperish')) return 'nonperishables'
  return null
}

export function SpendingAveragesPage() {
  const [selectedAccount, setSelectedAccount] = useState<Account>('josh')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')

  const {
    data: currentStatementPeriod,
    isPending: currentStatementPeriodLoading,
    isError: currentStatementPeriodError,
  } = useCurrentStatementPeriod()

  const availablePeriods = useMemo(() => {
    return buildStatementPeriodWindow(currentStatementPeriod?.statementPeriod, 4)
  }, [currentStatementPeriod])

  useEffect(() => {
    if (selectedPeriod) return
    if (availablePeriods.length === 0) return
    setSelectedPeriod(availablePeriods[4] ?? availablePeriods[availablePeriods.length - 1])
  }, [selectedPeriod, availablePeriods])

  // Fetch transactions for the selected account and statement period only
  const { data: txData, isPending: txPending, isError: txError } = useTransactions(selectedAccount, selectedPeriod ? { statementPeriod: selectedPeriod } : undefined)

  const anyPending = currentStatementPeriodLoading || txPending
  const anyError = currentStatementPeriodError || txError

  // Use only the filtered transactions
  const allTransactions = useMemo(() => {
    return txData?.transactions ?? []
  }, [txData])

  // Calculate weeks for all transactions (for Gas)
  const gasTransactions = allTransactions.filter((t) => classifyMetric(t.category) === 'gas')
  const gasWeeks = useCalculateWeeks(gasTransactions)
  const gasWeeklyAverage = useWeeklyAverage(gasWeeks)

  const [modalMetric, setModalMetric] = useState<MetricKey | null>(null)

  // Filter transactions for the selected metric
  // allTransactions is already filtered by selectedAccount and selectedPeriod via useTransactions
  // The modal further filters by the selected metric only
  const modalTransactions = useMemo(() => {
    if (!modalMetric) return []
    return allTransactions.filter((t) => classifyMetric(t.category) === modalMetric)
  }, [modalMetric, allTransactions])

  return (
    <MainLayout>
      <div className="tt-card" style={{ minHeight: 'auto' }}>
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
            {currentStatementPeriodError && <p className="tt-error">Failed to load current statement period.</p>}

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

        <div className="tt-subcard">
          <div style={{ padding: '6px 6px 0' }}>
            <div style={{ fontWeight: 950, letterSpacing: '0.02em' }}>Weekly Spending Averages</div>
            <div style={{ marginTop: 6, color: 'rgba(230, 238, 248, 0.70)', fontSize: 12, lineHeight: 1.4 }}>
              Excludes the current week. Weeks are counted from the first transaction week in the loaded window.
            </div>
          </div>

          {anyPending && <p className="tt-empty">Loading transactions...</p>}
          {anyError && <p className="tt-error">Failed to load transactions for averages.</p>}

          {!anyPending && !anyError && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
                padding: 6,
              }}
            >
              {/* Gas Card Example */}
              <div
                className="tt-row"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  padding: 18,
                  minHeight: 120,
                  border: '1.5px solid rgba(141, 176, 255, 0.25)',
                  background: 'linear-gradient(135deg, rgba(141,176,255,0.10) 0%, rgba(15,17,21,0.85) 100%)',
                  boxShadow: '0 2px 16px 0 rgba(141,176,255,0.07)',
                  transition: 'box-shadow 0.18s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 950, fontSize: 18, letterSpacing: '0.01em', color: '#e6eef8' }}>⛽ Gas</div>
                  </div>
                  <button
                    style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', fontWeight: 950, color: '#8db0ff', fontSize: 28, letterSpacing: '-0.01em' }}
                    onClick={() => { setModalMetric('gas') }}
                    aria-label="Show gas transactions"
                  >
                    {formatMoney(gasWeeklyAverage)}
                  </button>
                </div>
                <div style={{ fontSize: 13, color: '#b0c4de', marginTop: 10, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span>Weeks with gas: <b style={{ color: '#e6eef8' }}>{gasWeeks.length}</b></span>
                  {gasWeeks.length > 0 && (
                    <span>Total: <b style={{ color: '#e6eef8' }}>{formatMoney(gasWeeks.reduce((sum, w) => sum + w.totalAmount, 0))}</b></span>
                  )}
                </div>
                {/* Decorative accent */}
                <div style={{
                  position: 'absolute',
                  right: -30,
                  top: -30,
                  width: 90,
                  height: 90,
                  background: 'radial-gradient(circle, rgba(141,176,255,0.18) 0%, rgba(141,176,255,0.00) 70%)',
                  pointerEvents: 'none',
                  zIndex: 0,
                }} />
              </div>
              {/* ...other metric cards... */}
            </div>
          )}
        </div>
      </div>
      <TransactionList transactions={modalTransactions} />
    </MainLayout>
  )
}
