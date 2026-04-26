import { useState } from 'react'
import { useProfileStore } from '../store/useProfileStore'
import type { Account } from '../store/useProfileStore'

const PROFILE_ICONS: Record<Account, string> = {
  josh: '👨‍💼',
  joint: '🤝',
  anna: '👩‍💼',
}

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

  return (
    <div style={{
      position: 'fixed',
      bottom: 100,
      right: 24,
      zIndex: 9999, // ensure on top
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      borderRadius: 24,
      minWidth: 80,
      minHeight: 80,
    }}>
      {open ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          marginBottom: 8,
          background: 'rgba(30,30,40,0.98)',
          borderRadius: 18,
          boxShadow: '0 2px 12px 0 rgba(0,0,0,0.18)',
          padding: 16,
        }}>
          {ACCOUNTS.map((acct) => (
            <button
              key={acct}
              onClick={() => {
                setSelectedAccount(acct)
                setOpen(false)
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                outline: 'none',
                opacity: selectedAccount === acct ? 1 : 0.7,
                transform: selectedAccount === acct ? 'scale(1.08)' : 'scale(1)',
                transition: 'all 0.15s',
              }}
              aria-label={`Switch to ${PROFILE_LABELS[acct]}`}
            >
              <span style={{
                fontSize: 38,
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: selectedAccount === acct ? '#3b82f6' : '#23232b',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4,
                border: selectedAccount === acct ? '3px solid #fff' : '2px solid #444',
                boxShadow: selectedAccount === acct ? '0 2px 8px 0 rgba(59,130,246,0.18)' : undefined,
                transition: 'all 0.15s',
              }}>{PROFILE_ICONS[acct]}</span>
              <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{PROFILE_LABELS[acct]}</span>
            </button>
          ))}
        </div>
      ) : null}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close profile switcher' : `Current profile: ${PROFILE_LABELS[selectedAccount]}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <span style={{
          fontSize: 38,
          width: 54,
          height: 54,
          borderRadius: '50%',
          background: '#3b82f6',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 4,
          border: '3px solid #fff',
          boxShadow: '0 2px 8px 0 rgba(59,130,246,0.18)',
        }}>{PROFILE_ICONS[selectedAccount]}</span>
        <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{PROFILE_LABELS[selectedAccount]}</span>
      </button>
    </div>
  )
}
