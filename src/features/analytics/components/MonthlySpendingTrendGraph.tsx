import { useMemo, useState } from 'react'
import { useProfileStore } from '@/store/useProfileStore'
import { useMonthlySpendingTrends } from '../hooks/useMonthlySpendingTrends.ts'
import { buildMonthlySpendingTrendStats } from '../utils/monthlySpendingTrend'

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const formatProfileLabel = (profile: string) => profile.charAt(0).toUpperCase() + profile.slice(1)

const buildTrend = (current: number, previous: number, windowTotal: number) => {
  const delta = current - previous
  const percent = windowTotal !== 0 ? (delta / windowTotal) * 100 : null
  return {
    delta,
    percent,
    direction: delta > 0 ? ('growing' as const) : delta < 0 ? ('decreasing' as const) : ('flat' as const),
  }
}

export const MonthlySpendingTrendGraph = () => {
  const profile = useProfileStore((state) => state.profile)
  const [monthCount, setMonthCount] = useState<3 | 6>(6)
  const { data, allTimeTotals, isPending, isError } = useMonthlySpendingTrends(profile, monthCount)

  const maxTotal = useMemo(() => data.reduce((max, point) => Math.max(max, point.totalAmount), 0), [data])
  const stats = useMemo(() => buildMonthlySpendingTrendStats(data), [data])

  const width = Math.max(640, data.length * 120)
  const height = 220
  const paddingX = 28
  const paddingY = 22
  const innerWidth = width - paddingX * 2
  const innerHeight = height - paddingY * 2

  const baselineY = height - paddingY
  const segmentWidth = data.length > 1 ? Math.max(18, (innerWidth / (data.length - 1)) * 0.7) : Math.max(18, innerWidth * 0.7)

  const points = data.map((point, index) => {
    const x = data.length === 1 ? width / 2 : paddingX + (innerWidth * index) / (data.length - 1)
    const y = maxTotal > 0 ? paddingY + innerHeight - (point.totalAmount / maxTotal) * innerHeight : paddingY + innerHeight
    const nonessentialY =
      maxTotal > 0
        ? paddingY + innerHeight - (point.nonessentialAmount / maxTotal) * innerHeight
        : paddingY + innerHeight
    const plannedY =
      maxTotal > 0
        ? paddingY + innerHeight - ((point.nonessentialAmount + point.plannedAmount) / maxTotal) * innerHeight
        : paddingY + innerHeight
    return { ...point, x, y, nonessentialY, plannedY, baselineY }
  })
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

  const latest = data.at(-1)
  const first = data[0]
  const allTimeTotalAmount =
    allTimeTotals.essentialAmount + allTimeTotals.nonessentialAmount + allTimeTotals.plannedAmount
  const monthlyTrend = buildTrend(latest?.totalAmount ?? 0, first?.totalAmount ?? 0, allTimeTotalAmount)
  const essentialTrend = buildTrend(latest?.essentialAmount ?? 0, first?.essentialAmount ?? 0, allTimeTotals.essentialAmount)
  const nonessentialTrend = buildTrend(latest?.nonessentialAmount ?? 0, first?.nonessentialAmount ?? 0, allTimeTotals.nonessentialAmount)

  const trendTone = (direction: 'growing' | 'decreasing' | 'flat') =>
    direction === 'decreasing' ? '#1fbf75' : direction === 'growing' ? '#f87171' : 'rgba(230,238,248,0.65)'

  return (
    <section className="tt-card" style={{ padding: 16, display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 950, letterSpacing: '0.02em' }}>Monthly spending trend</div>
          <div style={{ color: 'rgba(230,238,248,0.65)', fontSize: 13 }}>
            Current profile: {formatProfileLabel(profile)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[6, 3].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setMonthCount(count as 3 | 6)}
              style={{
                border: 'none',
                borderRadius: 999,
                padding: '8px 12px',
                background: monthCount === count ? '#23242a' : 'rgba(255,255,255,0.05)',
                color: monthCount === count ? '#8db0ff' : 'rgba(230,238,248,0.78)',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {count} mo
            </button>
          ))}
        </div>
      </div>

      {isPending && <p className="tt-empty">Loading spending trend...</p>}
      {isError && <p className="tt-error">Failed to load spending trend.</p>}
      {!isPending && !isError && data.length === 0 && <p className="tt-empty">No spending trend data available.</p>}

      {!isPending && !isError && data.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: 'rgba(230,238,248,0.78)', fontSize: 12 }}>
            <span><span style={{ color: '#1fbf75' }}>■</span> Essential</span>
            <span><span style={{ color: '#a855f7' }}>■</span> Planned</span>
            <span><span style={{ color: '#3b82f6' }}>■</span> Nonessential</span>
          </div>
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <div style={{ width, minWidth: '100%' }}>
              <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Monthly spending trend chart" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <linearGradient id="monthly-spending-trend-area" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                <line x1={paddingX} y1={baselineY} x2={width - paddingX} y2={baselineY} stroke="rgba(255,255,255,0.10)" />

                {maxTotal > 0 && (
                  <>
                    {points.map((point) => {
                      const barX = point.x - segmentWidth / 2
                      const nonessentialHeight = Math.max(0, baselineY - point.nonessentialY)
                      const plannedHeight = Math.max(0, point.nonessentialY - point.plannedY)
                      const essentialHeight = Math.max(0, point.plannedY - point.y)

                      return (
                        <g key={`${point.label}-fill`}>
                          {nonessentialHeight > 0 && (
                            <rect
                              x={barX}
                              y={point.nonessentialY}
                              width={segmentWidth}
                              height={nonessentialHeight}
                              rx="5"
                              fill="#3b82f6"
                              fillOpacity="0.22"
                            />
                          )}
                          {plannedHeight > 0 && (
                            <rect
                              x={barX}
                              y={point.plannedY}
                              width={segmentWidth}
                              height={plannedHeight}
                              rx="5"
                              fill="#a855f7"
                              fillOpacity="0.24"
                            />
                          )}
                          {essentialHeight > 0 && (
                            <rect
                              x={barX}
                              y={point.y}
                              width={segmentWidth}
                              height={essentialHeight}
                              rx="5"
                              fill="#1fbf75"
                              fillOpacity="0.20"
                            />
                          )}
                        </g>
                      )
                    })}
                    <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                )}

                {points.map((point) => (
                  <g key={point.label}>
                    <circle cx={point.x} cy={point.y} r="5.5" fill="#8db0ff" stroke="#0f1117" strokeWidth="2" />
                    <title>{`${point.label}: ${formatCurrency(point.totalAmount)}`}</title>
                  </g>
                ))}
              </svg>

              <div style={{ position: 'relative', height: 52 }}>
                {points.map((point) => (
                  <div
                    key={point.label}
                    style={{
                      position: 'absolute',
                      left: point.x,
                      transform: 'translateX(-50%)',
                      top: 0,
                      width: 92,
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{point.label}</div>
                    <div style={{ fontSize: 12, color: 'rgba(230,238,248,0.65)' }}>{formatCurrency(point.totalAmount)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: 12,
            }}
          >
            <div style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: 12, color: 'rgba(230,238,248,0.65)' }}>Monthly average</div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{formatCurrency(stats.monthlyAverage)}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: trendTone(monthlyTrend.direction) }}>
                {monthlyTrend.direction === 'growing' ? '↑' : monthlyTrend.direction === 'decreasing' ? '↓' : '•'}{' '}
                {monthlyTrend.percent == null ? '0%' : `${Math.abs(monthlyTrend.percent).toFixed(1)}%`}
              </div>
            </div>

            <div style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: 12, color: 'rgba(230,238,248,0.65)' }}>Essential average</div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{formatCurrency(stats.essentialAverage)}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: trendTone(essentialTrend.direction) }}>
                {essentialTrend.direction === 'growing' ? '↑' : essentialTrend.direction === 'decreasing' ? '↓' : '•'}{' '}
                {essentialTrend.percent == null ? '0%' : `${Math.abs(essentialTrend.percent).toFixed(1)}%`}
              </div>
            </div>

            <div style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: 12, color: 'rgba(230,238,248,0.65)' }}>Nonessential average</div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{formatCurrency(stats.nonessentialAverage)}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: trendTone(nonessentialTrend.direction) }}>
                {nonessentialTrend.direction === 'growing' ? '↑' : nonessentialTrend.direction === 'decreasing' ? '↓' : '•'}{' '}
                {nonessentialTrend.percent == null ? '0%' : `${Math.abs(nonessentialTrend.percent).toFixed(1)}%`}
              </div>
            </div>
          </div>
          </>
      )}
    </section>
  )
}
