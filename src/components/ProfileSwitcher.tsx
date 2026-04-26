import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfileStore } from '../store/useProfileStore'
import type { Account } from '../store/useProfileStore'

const PRIMARY = '#2563eb'; // Project blue
const PRIMARY_LIGHT = '#3b82f6'; // Lighter blue for hover
const NEUTRAL_BG = '#f3f4f6'; // Light gray
const NEUTRAL_BORDER = '#bbb';
const NEUTRAL_TEXT = '#222';
const WHITE = '#fff';
const SELECTED_BG = '#e5e7eb'; // Modern gray for selected
const SELECTED_BORDER = '#bbb'; // Gray border for selected
const SELECTED_TEXT = '#222';

const PROFILE_LABELS: Record<Account, string> = {
  josh: 'Josh',
  joint: 'Joint',
  anna: 'Anna',
}

const ACCOUNTS: Account[] = ['josh', 'joint', 'anna']

export function ProfileSwitcher() {
  const selectedAccount = useProfileStore((state) => state.profile)
  const setSelectedAccount = useProfileStore((state) => state.setProfile)
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    if (!open) return;
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
  }, [open])

  // Only show the other profiles (not the selected one) as options
  const otherAccounts = ACCOUNTS.filter((acct) => acct !== selectedAccount)

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
          {open && otherAccounts.map((acct, idx) => (
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
                border: `2px solid ${hovered === acct ? PRIMARY : NEUTRAL_BORDER}`,
                background: hovered === acct ? PRIMARY_LIGHT : NEUTRAL_BG,
                color: hovered === acct ? WHITE : NEUTRAL_TEXT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                outline: 'none',
                boxShadow: hovered === acct
                  ? `0 2px 8px 0 rgba(37,99,235,0.18)`
                  : '0 2px 8px 0 rgba(37,99,235,0.10)',
                marginBottom: 0,
                pointerEvents: open ? 'auto' : 'none',
                transition: 'background 0.18s, border 0.18s, color 0.18s, box-shadow 0.18s',
              }}
              aria-label={`Switch to ${PROFILE_LABELS[acct]}`}
              tabIndex={open ? 0 : -1}
              onFocus={e => e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_LIGHT}`}
              onBlur={e => e.currentTarget.style.boxShadow = hovered === acct
                ? `0 2px 8px 0 rgba(37,99,235,0.18)`
                : '0 2px 8px 0 rgba(37,99,235,0.10)'}
            >
              {PROFILE_LABELS[acct]}
            </motion.button>
          ))}
        </AnimatePresence>
        {/* Main profile button */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close profile switcher' : `Current profile: ${PROFILE_LABELS[selectedAccount]}`}
          style={{
            width: 54,
            height: 54,
            borderRadius: '50%',
            border: `3px solid ${SELECTED_BORDER}`,
            background: SELECTED_BG,
            color: SELECTED_TEXT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 16,
            cursor: 'pointer',
            outline: 'none',
            boxShadow: `0 2px 8px 0 rgba(37,99,235,0.10)`,
            margin: '0 auto',
            position: 'relative',
            zIndex: 2,
            transition: 'background 0.18s, border 0.18s, box-shadow 0.18s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = NEUTRAL_BG}
          onMouseLeave={e => e.currentTarget.style.background = SELECTED_BG}
          onFocus={e => e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY_LIGHT}`}
          onBlur={e => e.currentTarget.style.boxShadow = `0 2px 8px 0 rgba(37,99,235,0.10)`}
        >
          {PROFILE_LABELS[selectedAccount]}
        </button>
      </div>
    </div>
  )
}
