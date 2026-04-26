import React from 'react'

interface StatementPeriodDropdownProps {
  availablePeriods: string[]
  selectedPeriod: string
  setSelectedPeriod: (period: string) => void
  loading?: boolean
  error?: boolean
}

export const StatementPeriodDropdown: React.FC<StatementPeriodDropdownProps> = ({
  availablePeriods,
  selectedPeriod,
  setSelectedPeriod,
  loading = false,
  error = false,
}) => {
  return (
    <div
      style={{
        width: '100vw',
        background: '#181922',
        boxShadow: '0 2px 8px 0 rgba(0,0,0,0.18)',
        borderBottom: '1px solid #23242a',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        minHeight: '56px',
        fontFamily: 'var(--sans)',
        color: 'var(--text, #e6eef8)',
      }}
    >
      <label htmlFor="period-select" style={{ fontWeight: 600, fontSize: '1rem', color: '#e6eef8', marginRight: 8 }}>
        Statement Period
      </label>
      <select
        id="period-select"
        value={selectedPeriod}
        onChange={e => setSelectedPeriod(e.target.value)}
        style={{
          font: 'inherit',
          color: '#e6eef8',
          background: '#23242a',
          border: '1px solid #35363c',
          borderRadius: 8,
          padding: '0.4em 1.5em 0.4em 0.8em',
          minWidth: 140,
          maxWidth: 220,
          boxShadow: 'none',
          outline: 'none',
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          transition: 'border-color 0.18s',
        }}
      >
        <option value="">All Periods</option>
        {availablePeriods.map(period => (
          <option key={period} value={period}>
            {period}
          </option>
        ))}
      </select>
      {loading && <span style={{ color: '#e6eef8', opacity: 0.7, fontSize: '0.95em' }}>Loading...</span>}
      {error && <span style={{ color: '#ff4d4f', fontSize: '0.95em' }}>Failed to load periods.</span>}
    </div>
  )
}
