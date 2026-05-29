import type { CSSProperties } from 'react'
import type { CriticalitySummary } from '@/features/transactions/api/criticalitySummary.types.ts'

const formatCurrency = (value: number) =>
  value.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

const ringStyle = (projectedFraction: number, colorActual: string, colorProjected: string): CSSProperties => {
  const projected = clamp01(projectedFraction)
  const projectedDeg = projected * 360

  return {
    background: `conic-gradient(${colorProjected} 0deg ${projectedDeg}deg, ${colorActual} ${projectedDeg}deg 360deg)`,
  }
}

export const DualRingStat = (props: {
  essential: CriticalitySummary
  nonessential: CriticalitySummary
}) => {
  const totalEssential = props.essential.actualTotal + props.essential.projectedTotal
  const projectedFractionEssential = totalEssential === 0 ? 0 : props.essential.projectedTotal / totalEssential
  const totalNonessential = props.nonessential.actualTotal + props.nonessential.projectedTotal
  const projectedFractionNonessential = totalNonessential === 0 ? 0 : props.nonessential.projectedTotal / totalNonessential

  return (
    <div className="tt-crit-stat tt-crit-dual-ring">
      <div className="tt-crit-dual-ring-inner">
        <div className="tt-crit-ring-box">
          <div className="tt-crit-title">Essential</div>
          <div className="tt-crit-ring" style={ringStyle(projectedFractionEssential, '#1fbf75', '#f5c542')}>
            <div className="tt-crit-ring-inner">
              <div className="tt-crit-amount">{formatCurrency(totalEssential)}</div>
            </div>
          </div>
        </div>
        <div className="tt-crit-ring-box">
          <div className="tt-crit-title">Nonessential</div>
          <div className="tt-crit-ring" style={ringStyle(projectedFractionNonessential, '#3b82f6', '#f5c542')}>
            <div className="tt-crit-ring-inner">
              <div className="tt-crit-amount">{formatCurrency(totalNonessential)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

