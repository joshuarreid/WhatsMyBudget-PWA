import type { ReactNode } from 'react'
import { session } from '../api/auth/session'
import { useLogout } from '../features/auth/hooks/useLogout'

interface MainLayoutProps {
  children: ReactNode
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const logout = useLogout()
  const authed = session.isAuthenticated()

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0f1115, #151516)',
      }}
    >
      <main
        style={{
          padding: '1rem',
          paddingBottom: '110px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '0.75rem',
            minHeight: '44px',
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
                  cursor: 'pointer',
                  fontWeight: 800,
                }}
              >
                Logout
              </button>
            )}
          </div>
        </div>

        {children}
      </main>
    </div>
  )
}
