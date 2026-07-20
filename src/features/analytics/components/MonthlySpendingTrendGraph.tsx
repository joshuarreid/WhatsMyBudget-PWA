import { useMemo, useState } from 'react'
import { useProfileStore } from '@/store/useProfileStore'
import { useMonthlySpendingTrends } from '../hooks/useMonthlySpendingTrends.ts'
import { buildMonthlySpendingTrendStats } from '../utils/monthlySpendingTrend'

const formatCurrency = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const formatProfileLabel = (profile: string) => profile.charAt(0).toUpperCase() + profile.slice(1)

export const MonthlySpendingTrendGraph = () => {
  const profile = useProfileStore((state) => state.profile)
  const [monthCount, setMonthCount] = useState<3 | 6>(6)
  const { data, isPending, isError } = useMonthlySpendingTrends(profile, monthCount)

  const maxTotal = useMemo(() => data.reduce((max, point) => Math.max(max, point.totalAmount), 0), [data])
  const stats = useMemo(() => buildMonthlySpendingTrendStats(data), [data])

  const width = Math.max(640, data.length * 120)
  const height = 220
  const paddingX = 28
  const paddingY = 22
  const innerWidth = width - paddingX * 2
  const innerHeight = height - paddingY * 2

  const points = data.map((point, index) => {
    const x = data.length === 1 ? width / 2 : paddingX + (innerWidth * index) / (data.length - 1)
    const y = maxTotal > 0 ? paddingY + innerHeight - (point.totalAmount / maxTotal) * innerHeight : paddingY + innerHeight
    return { ...point, x, y }
  })

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  const areaPath = points.length
    ? `${linePath} L ${points.at(-1)?.x ?? paddingX} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : ''

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
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <div style={{ width, minWidth: '100%' }}>
              <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Monthly spending trend chart" style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                  <linearGradient id="monthly-spending-trend-area" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="rgba(255,255,255,0.10)" />

                {maxTotal > 0 && (
                  <>
                    <path d={areaPath} fill="url(#monthly-spending-trend-area)" />
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
            </div>

            <div style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: 12, color: 'rgba(230,238,248,0.65)' }}>Essential average</div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{formatCurrency(stats.essentialAverage)}</div>
            </div>

            <div style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: 12, color: 'rgba(230,238,248,0.65)' }}>Nonessential average</div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{formatCurrency(stats.nonessentialAverage)}</div>
            </div>

            <div style={{ padding: 14, borderRadius: 14, background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: 12, color: 'rgba(230,238,248,0.65)' }}>Trend</div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: stats.trend === 'growing' ? '#f87171' : stats.trend === 'decreasing' ? '#1fbf75' : 'rgba(230,238,248,0.9)',
                }}
              >
                {stats.trend === 'growing' ? 'Increasing' : stats.trend === 'decreasing' ? 'Decreasing' : 'Flat'}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: stats.trend === 'growing' ? '#f87171' : stats.trend === 'decreasing' ? '#1fbf75' : 'rgba(230,238,248,0.65)',
                }}
              >
                {stats.trendAmount >= 0 ? '+' : '-'}
                {formatCurrency(Math.abs(stats.trendAmount))}
                {stats.trendPercent == null ? '' : ` (${Math.abs(stats.trendPercent).toFixed(1)}%)`}
              </div>
            </div>
          </div>
          </>
      )}
    </section>
  )
}
