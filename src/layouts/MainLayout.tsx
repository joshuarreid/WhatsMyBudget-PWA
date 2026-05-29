import type { ReactNode } from 'react'
import { session } from '../features/auth/api/session.ts'
import { useLogout } from '@/features/auth'
import { useInitStatementPeriod } from '../store/useInitStatementPeriod'
import { useStatementPeriodStore } from '../store/useStatementPeriodStore'
import { StatementPeriodDropdown } from '../components/StatementPeriodDropdown'

interface MainLayoutProps {
  children: ReactNode
  /** Hide the sticky statement period chooser under the header (useful for Chat, etc.). */
  hideStatementPeriodChooser?: boolean
}

const Header = ({ authed, logout }: { authed: boolean, logout: () => void }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      gap: '0.75rem',
      minHeight: '44px',
      background: 'transparent',
      position: 'sticky',
      top: 0,
      zIndex: 20,
      backgroundColor: '#181922',
    }}
  >
    <div />
    <div
      style={{
        textAlign: 'center',
        fontWeight: 950,
        fontSize: '1.25rem',
        letterSpacing: '0.02em',
        color: '#e6eef8',
        userSelect: 'none',
      }}
    >
      WhatsMyBudget
    </div>
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      {authed && (
        <button
          type="button"
          onClick={logout}
          style={{
            padding: '8px 12px',
            borderRadius: '999px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(255, 255, 255, 0.02)',
            color: '#e6eef8',
            fontWeight: 600,
            fontSize: '1rem',
            cursor: 'pointer',
            transition: 'background 0.18s, border-color 0.18s',
          }}
        >
          Log Off
        </button>
      )}
    </div>
  </div>
)

const StickyDropdown = () => {
  const availablePeriods = useStatementPeriodStore(s => s.availablePeriods)
  const selectedPeriod = useStatementPeriodStore(s => s.selectedPeriod)
  const setSelectedPeriod = useStatementPeriodStore(s => s.setSelectedPeriod)
  const loading = useStatementPeriodStore(s => s.loading)
  const error = useStatementPeriodStore(s => s.error)
  return (
    <div style={{ position: 'sticky', top: 44, zIndex: 10, background: '#181922' }}>
      <StatementPeriodDropdown
        availablePeriods={availablePeriods}
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
        loading={loading}
        error={error}
      />
    </div>
  );
}

export const MainLayout = ({ children, hideStatementPeriodChooser }: MainLayoutProps) => {
  useInitStatementPeriod()
  const logout = useLogout()
  const authed = session.isAuthenticated()
  return (
    <div
      style={{
        height: '100%',
        minHeight: '100dvh',
        background: 'linear-gradient(180deg, #0f1115, #151516)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Header authed={authed} logout={logout} />
      {!hideStatementPeriodChooser ? <StickyDropdown /> : null}
      <main
        style={{
          padding: '1rem',
          paddingBottom: '110px',
          maxWidth: '1200px',
          margin: '0 auto',
          paddingTop: 0,
          width: '100%',
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </main>
    </div>
  )
}
