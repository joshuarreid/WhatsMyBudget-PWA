import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfileStore } from '../store/useProfileStore'
import type { Account } from '../store/useProfileStore'

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

  // Only show the other profiles (not the selected one) as options
  const otherAccounts = ACCOUNTS.filter((acct) => acct !== selectedAccount)

  return (
    <div
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
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 54,
                height: 54,
                borderRadius: '50%',
                border: '2px solid #bbb',
                background: '#f3f4f6',
                color: '#222',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 16,
                cursor: 'pointer',
                outline: 'none',
                boxShadow: '0 2px 8px 0 rgba(37,99,235,0.10)',
                marginBottom: 0,
                pointerEvents: open ? 'auto' : 'none',
              }}
              aria-label={`Switch to ${PROFILE_LABELS[acct]}`}
              tabIndex={open ? 0 : -1}
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
            border: '3px solid #2563eb',
            background: '#2563eb',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 16,
            cursor: 'pointer',
            outline: 'none',
            boxShadow: '0 2px 8px 0 rgba(37,99,235,0.18)',
            margin: '0 auto',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {PROFILE_LABELS[selectedAccount]}
        </button>
      </div>
    </div>
  )
}
