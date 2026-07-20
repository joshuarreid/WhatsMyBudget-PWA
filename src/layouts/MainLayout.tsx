import { useRef, type ReactNode, type TouchEvent as ReactTouchEvent } from 'react'
import { session } from '../features/auth/api/session.ts'
import { useInitStatementPeriod } from '../store/useInitStatementPeriod'
import { useStatementPeriodStore } from '../store/useStatementPeriodStore'
import { StatementPeriodDropdown } from '../components/StatementPeriodDropdown'
import { useCurrentRoute, useNavigate } from '../pages/router'

interface MainLayoutProps {
  children: ReactNode
  /** Hide the sticky statement period chooser under the header (useful for Chat, etc.). */
  hideStatementPeriodChooser?: boolean
}

const HEADER_HEIGHT = 56
const CHAT_RESET_EVENT = 'wmb:chat-reset'

const ChatIcon = ({ active }: { active: boolean }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M7 18.5 3.5 21V6a2 2 0 0 1 2-2H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      strokeLinecap="round"
      opacity={active ? 1 : 0.92}
    />
    <path
      d="M8 9h9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity={active ? 1 : 0.92}
    />
    <path
      d="M8 13h6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      opacity={active ? 1 : 0.92}
    />
  </svg>
)

const BackArrowIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M15 5 8 12l7 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const Header = ({ authed }: { authed: boolean }) => {
  const route = useCurrentRoute()
  const navigate = useNavigate()
  const chatActive = route === '/chat'
  const title = chatActive ? 'Chat' : 'WhatsMyBudget'

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        gap: '0.75rem',
        minHeight: `${HEADER_HEIGHT}px`,
        background: 'transparent',
        position: 'sticky',
        top: 0,
        zIndex: 20,
        backgroundColor: '#181922',
        padding: '6px 0.75rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        {authed && chatActive ? (
          <button
            type="button"
            onClick={() => navigate('/')}
            aria-label="Back to main app"
            title="Back to main app"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '42px',
              height: '42px',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.02)',
              color: '#e6eef8',
              cursor: 'pointer',
              transition: 'background 0.18s, border-color 0.18s',
            }}
          >
            <BackArrowIcon />
          </button>
        ) : null}
      </div>
      <div
        style={{
          textAlign: 'center',
          fontWeight: 950,
          fontSize: '1.3rem',
          letterSpacing: '0.02em',
          color: '#e6eef8',
          userSelect: 'none',
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {authed && chatActive ? (
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(CHAT_RESET_EVENT))}
            aria-label="Start a new conversation"
            title="New conversation"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '42px',
              height: '42px',
              borderRadius: '999px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.02)',
              color: '#e6eef8',
              cursor: 'pointer',
              fontSize: '1.35rem',
              fontWeight: 800,
              lineHeight: 1,
              transition: 'background 0.18s, border-color 0.18s, color 0.18s',
            }}
          >
            +
          </button>
        ) : authed && !chatActive ? (
          <button
            type="button"
            onClick={() => navigate('/chat')}
            aria-current={chatActive ? 'page' : undefined}
            aria-label="Open chat"
            title="Open chat"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px',
              width: '42px',
              height: '42px',
              borderRadius: '999px',
              border: `1px solid ${chatActive ? 'rgba(141, 176, 255, 0.36)' : 'rgba(255, 255, 255, 0.12)'}`,
              background: chatActive ? 'rgba(141, 176, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
              color: chatActive ? '#8db0ff' : '#e6eef8',
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'background 0.18s, border-color 0.18s, color 0.18s',
            }}
          >
            <ChatIcon active={chatActive} />
          </button>
        ) : null}
      </div>
    </div>
  )
}

const StickyDropdown = () => {
  const availablePeriods = useStatementPeriodStore(s => s.availablePeriods)
  const selectedPeriod = useStatementPeriodStore(s => s.selectedPeriod)
  const setSelectedPeriod = useStatementPeriodStore(s => s.setSelectedPeriod)
  const loading = useStatementPeriodStore(s => s.loading)
  const error = useStatementPeriodStore(s => s.error)
  return (
    <div style={{ position: 'sticky', top: HEADER_HEIGHT, zIndex: 10, background: '#181922' }}>
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
  const authed = session.isAuthenticated()
  const route = useCurrentRoute()
  const availablePeriods = useStatementPeriodStore((s) => s.availablePeriods)
  const selectedPeriod = useStatementPeriodStore((s) => s.selectedPeriod)
  const setSelectedPeriod = useStatementPeriodStore((s) => s.setSelectedPeriod)
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null)

  const shouldHandleSwipe = route === '/' || route === '/dashboard'

  const shiftStatementPeriod = (direction: 'prev' | 'next') => {
    if (!selectedPeriod || availablePeriods.length === 0) return
    const currentIndex = availablePeriods.indexOf(selectedPeriod)
    if (currentIndex === -1) return
    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    if (nextIndex < 0 || nextIndex >= availablePeriods.length) return
    setSelectedPeriod(availablePeriods[nextIndex])
  }

  const onMainTouchStart = (event: ReactTouchEvent<HTMLElement>) => {
    if (!shouldHandleSwipe || event.touches.length !== 1) return
    const target = event.target as HTMLElement | null
    if (!target) return
    if (
      target.closest('.tt-modal') ||
      target.closest('.tt-plan-period-scroll') ||
      target.closest('input, textarea, select, button, [role="button"]')
    ) {
      return
    }
    const touch = event.touches[0]
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const onMainTouchEnd = (event: ReactTouchEvent<HTMLElement>) => {
    if (!shouldHandleSwipe) return
    const start = swipeStartRef.current
    swipeStartRef.current = null
    if (!start || event.changedTouches.length === 0) return

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y

    const horizontalThreshold = 56
    if (Math.abs(deltaX) < horizontalThreshold) return
    if (Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) return

    if (deltaX < 0) {
      shiftStatementPeriod('next')
    } else {
      shiftStatementPeriod('prev')
    }
  }

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
      <Header authed={authed} />
      {!hideStatementPeriodChooser ? <StickyDropdown /> : null}
      <main
        onTouchStart={onMainTouchStart}
        onTouchEnd={onMainTouchEnd}
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
