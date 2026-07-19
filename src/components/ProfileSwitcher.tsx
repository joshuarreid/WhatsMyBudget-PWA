import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfileStore } from '../store/useProfileStore'
import type { Account } from '../store/useProfileStore'
import { useCurrentRoute } from '../pages/router'

type ProfileTheme = {
  bg: string
  border: string
  text: string
  hoverBg: string
  hoverBorder: string
  focusRing: string
}

const PROFILE_LABELS: Record<Account, string> = {
  josh: 'Josh',
  joint: 'Joint',
  anna: 'Anna',
}

const PROFILE_THEMES: Record<Account, ProfileTheme> = {
  // Soft per-profile palette so the selector stays easy on the eyes.
  josh: {
    bg: '#dbeafe',
    border: '#bfdbfe',
    text: '#1e3a8a',
    hoverBg: '#c7ddfb',
    hoverBorder: '#93c5fd',
    focusRing: 'rgba(59, 130, 246, 0.38)',
  },
  joint: {
    bg: '#e8dcf8',
    border: '#d7c2f4',
    text: '#4c1d95',
    hoverBg: '#dfcef5',
    hoverBorder: '#c4b5fd',
    focusRing: 'rgba(124, 58, 237, 0.32)',
  },
  anna: {
    bg: '#d9f5ea',
    border: '#b9e8d7',
    text: '#065f46',
    hoverBg: '#cbf1e1',
    hoverBorder: '#86efac',
    focusRing: 'rgba(16, 185, 129, 0.32)',
  },
}

const ACCOUNTS: Account[] = ['josh', 'joint', 'anna']

export function ProfileSwitcher() {
  const route = useCurrentRoute()

  const selectedAccount = useProfileStore((state) => state.profile)
  const setSelectedAccount = useProfileStore((state) => state.setProfile)
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const hidden = route === '/' || route === '/chat' || route === '/login'

  // Clamp open state when hidden so we don't render an open menu if the route changes back.
  const isOpen = open && !hidden

  // Close menu on outside click
  useEffect(() => {
    if (!isOpen) return
    function handleClick(event: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [isOpen])

  // Only show the other profiles (not the selected one) as options
  const otherAccounts = ACCOUNTS.filter((acct) => acct !== selectedAccount)

  if (hidden) return null

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        bottom: 100,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pointerEvents: 'none',
      }}
    >
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', pointerEvents: 'auto' }}>
        {/* Animated profile options */}
        <AnimatePresence>
          {isOpen && otherAccounts.map((acct, idx) => {
            const profileTheme = PROFILE_THEMES[acct]
            const isHovered = hovered === acct

            return (
              <motion.button
                key={acct}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: -70 - idx * 64 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30, delay: idx * 0.07 }}
                onClick={() => {
                  setSelectedAccount(acct)
                  setOpen(false)
                }}
                onMouseEnter={() => setHovered(acct)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  border: `2px solid ${isHovered ? profileTheme.hoverBorder : profileTheme.border}`,
                  background: isHovered ? profileTheme.hoverBg : profileTheme.bg,
                  color: profileTheme.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: 'pointer',
                  outline: 'none',
                  boxShadow: isHovered
                    ? '0 3px 10px 0 rgba(15, 23, 42, 0.16)'
                    : '0 2px 8px 0 rgba(15, 23, 42, 0.12)',
                  marginBottom: 0,
                  pointerEvents: isOpen ? 'auto' : 'none',
                  transition: 'background 0.18s, border 0.18s, color 0.18s, box-shadow 0.18s',
                }}
                aria-label={`Switch to ${PROFILE_LABELS[acct]}`}
                tabIndex={isOpen ? 0 : -1}
                onFocus={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${profileTheme.focusRing}`
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = isHovered
                    ? '0 3px 10px 0 rgba(15, 23, 42, 0.16)'
                    : '0 2px 8px 0 rgba(15, 23, 42, 0.12)'
                }}
              >
                {PROFILE_LABELS[acct]}
              </motion.button>
            )
          })}
        </AnimatePresence>

        {/* Main button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            width: 54,
            height: 54,
            borderRadius: '50%',
            border: `2px solid ${open ? PROFILE_THEMES[selectedAccount].hoverBorder : PROFILE_THEMES[selectedAccount].border}`,
            background: open ? PROFILE_THEMES[selectedAccount].hoverBg : PROFILE_THEMES[selectedAccount].bg,
            color: PROFILE_THEMES[selectedAccount].text,
            fontWeight: 800,
            fontSize: 16,
            cursor: 'pointer',
            outline: 'none',
            boxShadow: open
              ? '0 3px 12px 0 rgba(15, 23, 42, 0.18)'
              : '0 2px 10px 0 rgba(15, 23, 42, 0.15)',
            transition: 'background 0.18s, border 0.18s, color 0.18s, box-shadow 0.18s',
          }}
          aria-label="Switch profile"
        >
          {PROFILE_LABELS[selectedAccount]}
        </button>
      </div>
    </div>
  )
}
