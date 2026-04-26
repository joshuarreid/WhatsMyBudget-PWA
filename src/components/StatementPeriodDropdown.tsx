import React, { useRef, useEffect } from 'react'

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
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const selectedButtonRef = useRef<HTMLButtonElement>(null)
  const prevSelectedPeriod = useRef<string | undefined>(undefined)

  // Center selected pill whenever selection or periods change
  useEffect(() => {
    if (selectedButtonRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const button = selectedButtonRef.current;
      const offset = button.offsetLeft - (container.clientWidth / 2) + (button.offsetWidth / 2);
      // Only animate if the selection actually changed
      const animate = prevSelectedPeriod.current !== undefined && prevSelectedPeriod.current !== selectedPeriod;
      container.scrollTo({ left: offset, behavior: animate ? 'smooth' : 'auto' });
    }
    prevSelectedPeriod.current = selectedPeriod;
  }, [selectedPeriod, availablePeriods]);

  // Optionally keep the blur handler as a fallback (no-op now)
  const handleBlur = () => {};

  return (
    <div
      style={{
        width: '100vw',
        maxWidth: '100vw', // Prevent horizontal overflow
        background: '#181922',
        boxShadow: '0 2px 8px 0 rgba(0,0,0,0.18)',
        borderBottom: '1px solid #23242a',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        minHeight: '56px',
        fontFamily: 'var(--sans)',
        color: 'var(--text, #e6eef8)',
        overflowX: 'auto',
        overscrollBehaviorX: 'contain', // Prevent scroll chaining
        boxSizing: 'border-box', // Ensure padding doesn't cause overflow
      }}
    >
      {/* Removed label */}
      <div
        ref={scrollContainerRef}
        tabIndex={0}
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          padding: '2px 0',
          flex: 1,
          outline: 'none',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
          overscrollBehaviorX: 'contain', // Prevent scroll chaining
          minWidth: 0, // Prevent flex overflow
        }}
        onBlur={handleBlur}
        className="hide-scrollbar"
      >
        {/* Removed All Periods button */}
        {availablePeriods.map(period => (
          <button
            key={period}
            type="button"
            ref={selectedPeriod === period ? selectedButtonRef : undefined}
            onClick={() => setSelectedPeriod(period)}
            style={{
              padding: '0.4em 1.1em',
              borderRadius: 20,
              border: selectedPeriod === period ? '2px solid #3b82f6' : '1px solid #35363c',
              background: selectedPeriod === period ? '#23242a' : 'transparent',
              color: selectedPeriod === period ? '#3b82f6' : '#e6eef8',
              fontWeight: selectedPeriod === period ? 700 : 500,
              fontSize: '1em',
              cursor: 'pointer',
              outline: 'none',
              transition: 'border 0.18s, background 0.18s, color 0.18s',
              whiteSpace: 'nowrap',
            }}
          >
            {period}
          </button>
        ))}
      </div>
      {loading && <span style={{ color: '#e6eef8', opacity: 0.7, fontSize: '0.95em', marginLeft: 12 }}>Loading...</span>}
      {error && <span style={{ color: '#ff4d4f', fontSize: '0.95em', marginLeft: 12 }}>Failed to load periods.</span>}
    </div>
  )
}
