import React from 'react' // Ensure React types are imported for JSX namespace
import { useCurrentRoute, useNavigate } from '../pages/router'

type NavRoute = '/' | '/dashboard' | '/spending-averages'

type NavItem = {
  route: NavRoute
  label: string
  icon: (active: boolean) => React.ReactNode
}

const HomeIcon = ({ active }: { active: boolean }) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        opacity={active ? 1 : 0.9}
      />
    </svg>
  )
}

const CalendarIcon = ({ active }: { active: boolean }) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7 3v3M17 3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={active ? 1 : 0.9}
      />
    </svg>
  )
}

const PieIcon = ({ active }: { active: boolean }) => {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 2v10h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={active ? 1 : 0.9}
      />
      <path
        d="M21.1 12A9.1 9.1 0 1 1 12 2.9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={active ? 1 : 0.9}
      />
    </svg>
  )
}

export const BottomNav = () => {
  const route = useCurrentRoute()
  const navigate = useNavigate()

  // Only show on authed pages
  const current: NavRoute =
    route === '/spending-averages' ? '/spending-averages' : route === '/dashboard' ? '/dashboard' : '/'

  const items: NavItem[] = [
    {
      route: '/',
      label: 'Planning',
      icon: (active) => <CalendarIcon active={active} />,
    },
    {
      route: '/dashboard',
      label: 'Dashboard',
      icon: (active) => <HomeIcon active={active} />,
    },
    {
      route: '/spending-averages',
      label: 'Spending',
      icon: (active) => <PieIcon active={active} />,
    },
  ]

  return (
    <nav
      role="navigation"
      aria-label="Primary"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${items.length}, 1fr)`,
          alignItems: 'center',
          padding: '8px 10px',
          background: 'rgba(18, 20, 24, 0.78)',
          borderTop: '1px solid rgba(255, 255, 255, 0.10)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        }}
      >
        {items.map((item) => {
          const active = current === item.route

          return (
            <button
              key={item.route}
              type="button"
              onClick={() => navigate(item.route)}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'grid',
                placeItems: 'center',
                padding: '8px 6px',
                borderRadius: '10px',
                border: '1px solid transparent',
                background: active ? 'rgba(230, 238, 248, 0.08)' : 'transparent',
                color: active ? '#e6eef8' : 'rgba(230, 238, 248, 0.78)',
                cursor: 'pointer',
                transition: 'background 140ms ease, color 140ms ease',
                outline: 'none',
              }}
            >
              <div style={{ display: 'grid', placeItems: 'center', gap: '2px' }}>
                {item.icon(active)}
                <span style={{ fontSize: '10px', fontWeight: 850, letterSpacing: '0.02em' }}>
                  {item.label}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
