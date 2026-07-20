import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useProfileStore } from '@/store/useProfileStore'
import { fetchAccountProjectedTransactions } from '@/features/projectedTransactions/api/projectedTransactions.ts'
import { buildProjectedSpendingChartData } from '../utils/projectedSpendingChart'

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export const ProjectedSpendingBarChart = () => {
  const profile = useProfileStore((state) => state.profile)
  const [selectedSegment, setSelectedSegment] = useState<{
    monthLabel: string
    label: 'Essential' | 'Nonessential'
    amount: number
  } | null>(null)

  const { data, isPending, isError } = useQuery({
    queryKey: ['projected-spending-chart', profile],
    queryFn: () => fetchAccountProjectedTransactions(profile),
    enabled: Boolean(profile),
    placeholderData: (previous) => previous,
  })

  const chartData = useMemo(() => {
    const transactions = data?.projectedTransactions ?? data?.transactions ?? []
    return buildProjectedSpendingChartData(transactions)
  }, [data])

  const maxTotal = chartData.reduce((max, month) => Math.max(max, month.totalAmount), 0)

  return (
    <section className="tt-card" style={{ padding: 16, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 950, letterSpacing: '0.02em' }}>Projected monthly spending</div>
        </div>
      </div>

      {isPending && <p className="tt-empty">Loading projected spending...</p>}
      {isError && <p className="tt-error">Failed to load projected spending.</p>}

      {!isPending && !isError && chartData.length === 0 && (
        <p className="tt-empty">No projected transactions found for this profile.</p>
      )}

      {!isPending && !isError && chartData.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', color: 'rgba(230,238,248,0.78)', fontSize: 12 }}>
            <div><span style={{ color: '#1fbf75' }}>■</span> Essential</div>
            <div><span style={{ color: '#3b82f6' }}>■</span> Nonessential</div>
          </div>

          <div
            style={{
              minHeight: 48,
              padding: '10px 12px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.03)',
              color: 'rgba(230,238,248,0.9)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {selectedSegment ? (
              <div>
                <strong>{selectedSegment.label}</strong> in {selectedSegment.monthLabel}: {formatCurrency(selectedSegment.amount)}
              </div>
            ) : (
              <div>Click a bar segment to see its value.</div>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${chartData.length}, minmax(88px, 1fr))`,
              gap: 12,
              overflowX: 'auto',
              paddingBottom: 4,
            }}
          >
            {chartData.map((month) => {
              const barHeight = maxTotal > 0 ? (month.totalAmount / maxTotal) * 100 : 0
              const essentialHeight = month.totalAmount > 0 ? (month.essentialAmount / month.totalAmount) * 100 : 0
              const nonessentialHeight = month.totalAmount > 0 ? (month.nonessentialAmount / month.totalAmount) * 100 : 0

              return (
                <div key={month.statementPeriod} style={{ display: 'grid', gap: 8, minWidth: 88 }}>
                  <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(230,238,248,0.78)', minHeight: 18 }}>
                    {formatCurrency(month.totalAmount)}
                  </div>
                  <div
                    style={{
                      height: 240,
                      display: 'flex',
                      alignItems: 'flex-end',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 16,
                      padding: 8,
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: `${barHeight}%`,
                        minHeight: month.totalAmount > 0 ? 6 : 0,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        borderRadius: 12,
                      }}
                    >
                      {month.nonessentialAmount > 0 && (
                        <button
                          type="button"
                          aria-label={`${month.monthLabel} nonessential ${formatCurrency(month.nonessentialAmount)}`}
                          onClick={() => setSelectedSegment({
                            monthLabel: month.monthLabel,
                            label: 'Nonessential',
                            amount: month.nonessentialAmount,
                          })}
                          style={{
                            width: '100%',
                            height: `${nonessentialHeight}%`,
                            background: '#3b82f6',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            opacity: selectedSegment?.monthLabel === month.monthLabel && selectedSegment?.label === 'Nonessential' ? 1 : 0.88,
                          }}
                        />
                      )}
                      {month.essentialAmount > 0 && (
                        <button
                          type="button"
                          aria-label={`${month.monthLabel} essential ${formatCurrency(month.essentialAmount)}`}
                          onClick={() => setSelectedSegment({
                            monthLabel: month.monthLabel,
                            label: 'Essential',
                            amount: month.essentialAmount,
                          })}
                          style={{
                            width: '100%',
                            height: `${essentialHeight}%`,
                            background: '#1fbf75',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            opacity: selectedSegment?.monthLabel === month.monthLabel && selectedSegment?.label === 'Essential' ? 1 : 0.88,
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', fontWeight: 700, fontSize: 13, minHeight: 18 }}>
                    {month.monthLabel}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
