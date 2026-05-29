import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { ChatInput } from './ChatInput'
import { useConversationHistory } from '../hooks/useConversations'
import { useProfileStore } from '@/store/useProfileStore'
import type { Account } from '@/store/useProfileStore'
import { useStatementPeriodStore } from '@/store/useStatementPeriodStore'
import { Modal } from '@/components/Modal'

type UiMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: Date
  seq: number
}

const safeId = () => {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
}

const parseCreatedAt = (created_at?: string): Date | undefined => {
  if (!created_at) return undefined
  const d = new Date(created_at)
  return Number.isNaN(d.getTime()) ? undefined : d
}

const formatDay = (d: Date) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d)

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

const compareUiMessages = (a: UiMessage, b: UiMessage) => {
  const t = a.seq - b.seq
  return t !== 0 ? t : a.id.localeCompare(b.id)
}

/**
 * ChatWindow owns the chat state for the current conversation.
 * - Keeps the current conversation's message history in memory.
 * - When the user taps the + button, it starts a new conversation (clears state).
 * - When a conversationId is set, it loads the saved history for that conversation.
 */
export function ChatWindow() {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [liveMessages, setLiveMessages] = useState<UiMessage[]>([])
  const [lastEvent, setLastEvent] = useState<string>('')
  const [assistantIsTyping, setAssistantIsTyping] = useState(false)
  const nextSeqRef = useRef(1)

  const historyQuery = useConversationHistory(conversationId ?? undefined)
  const transcriptRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    console.log('[ChatWindow] mounted')
  }, [])

  const historyMessages = useMemo<UiMessage[]>(() => {
    if (!historyQuery.data) return []

    // Keep mapping pure; sequence is based on the API order.
    return historyQuery.data.messages.map((m, idx) => ({
      id: m.message_id ?? safeId(),
      role: m.role,
      content: m.content,
      createdAt: parseCreatedAt(m.created_at),
      seq: idx + 1,
    }))
  }, [historyQuery.data])

  // When history loads/changes, ensure new live messages append after it.
  useEffect(() => {
    if (!conversationId) return
    nextSeqRef.current = historyMessages.length + 1
  }, [conversationId, historyMessages.length])

  // Merge fetched history with optimistic live messages for the current conversation.
  const messages = useMemo(() => {
    // No conversation yet => only show what we've appended locally
    if (!conversationId) return [...liveMessages].sort(compareUiMessages)

    // Conversation exists: show history first, then any new live messages.
    // Avoid time-based sorting to prevent reordering from missing/odd timestamps.
    const byId = new Map<string, UiMessage>()
    for (const m of historyMessages) byId.set(m.id, m)
    for (const m of liveMessages) byId.set(m.id, m)

    return Array.from(byId.values()).sort(compareUiMessages)
  }, [conversationId, historyMessages, liveMessages])

  useEffect(() => {
    console.log('[ChatWindow] state', {
      conversationId,
      messageCount: messages.length,
      lastEvent,
      historyEnabled: Boolean(conversationId),
      historyStatus: historyQuery.status,
    })
  }, [conversationId, messages.length, lastEvent, historyQuery.status])

  // Scroll to bottom when messages change.
  useEffect(() => {
    const el = transcriptRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [messages.length])

  const renderRows = () => {
    const rows: React.ReactNode[] = []
    let lastDay: string | null = null

    for (const m of messages) {
      if (m.createdAt) {
        const key = dayKey(m.createdAt)
        if (key !== lastDay) {
          lastDay = key
          rows.push(
            <div key={`day-${key}`} className="chatDaySeparatorRow">
              <div className="chatDaySeparator">{formatDay(m.createdAt)}</div>
            </div>
          )
        }
      }

      rows.push(
        <div
          key={m.id}
          className={`chatMessageRow ${m.role === 'user' ? 'chatMessageRowUser' : 'chatMessageRowAssistant'}`}
        >
          <div
            className={`tt-card chatBubble ${m.role === 'user' ? 'chatBubbleUser' : 'chatBubbleAssistant'}`}
          >
            {m.role === 'assistant' ? (
              <div className="chatBubbleText chatMarkdown">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            ) : (
              <div className="chatBubbleText">{m.content}</div>
            )}
          </div>
        </div>
      )
    }

    if (assistantIsTyping) {
      rows.push(
        <div key="typing" className="chatMessageRow chatMessageRowAssistant">
          <div className="tt-card chatBubble chatBubbleAssistant chatTypingBubble" aria-label="Assistant is typing">
            <span className="chatTypingDot" />
            <span className="chatTypingDot" />
            <span className="chatTypingDot" />
          </div>
        </div>
      )
    }

    return rows
  }

  const activeProfile = useProfileStore((s) => s.profile)
  const availablePeriods = useStatementPeriodStore((s) => s.availablePeriods)
  const storeSelectedPeriod = useStatementPeriodStore((s) => s.selectedPeriod)

  // Filters the user picks *for this chat* (don’t necessarily track global switchers)
  const [accountFilter, setAccountFilter] = useState<Account | ''>('')
  const [periodFilter, setPeriodFilter] = useState<string>('')

  const [picker, setPicker] = useState<null | 'account' | 'period'>(null)

  // Default pills: Account shows placeholder; Period is blank until user selects.
  // (We intentionally do NOT default to the global selected statement period.)

  const accountLabel = useMemo(() => {
    if (!accountFilter) return 'Account'
    if (accountFilter === 'josh') return 'Josh'
    if (accountFilter === 'joint') return 'Joint'
    if (accountFilter === 'anna') return 'Anna'
    return 'Account'
  }, [accountFilter])

  const periodLabel = useMemo(() => periodFilter || 'Period', [periodFilter])

  const accountValueForApi: Account = (accountFilter || activeProfile) as Account
  const periodValueForApi: string | undefined = periodFilter || undefined

  const periodOptions = useMemo(() => {
    const opts = availablePeriods?.length ? availablePeriods : storeSelectedPeriod ? [storeSelectedPeriod] : []
    // Ensure the currently chosen period exists in the list so it can be re-selected
    if (periodFilter && !opts.includes(periodFilter)) return [periodFilter, ...opts]
    return opts
  }, [availablePeriods, storeSelectedPeriod, periodFilter])

  useEffect(() => {
    console.log('[ChatWindow] filters', { accountFilter, periodFilter })
  }, [accountFilter, periodFilter])

  return (
    <>
      <div
        ref={transcriptRef}
        className="chatTranscript"
        style={{
          paddingBottom:
            'calc(var(--bottom-nav-height) + var(--chat-input-max-height) + max(12px, env(safe-area-inset-bottom)))',
        }}
      >

        {renderRows()}
      </div>

      {/* Fixed footer: ChatInput stays static above the BottomNav */}
      <div className="chatFixedFooter" style={{ bottom: 'var(--bottom-nav-height)' }}>
        <div className="chatFixedFooterInner">
          <ChatInput
            conversationId={conversationId}
            onSendingChange={(sending) => setAssistantIsTyping(sending)}
            onConversationId={(id) => {
              console.log('[ChatWindow] setConversationId()', { id })
              setLastEvent('setConversationId')
              setConversationId((prev) => {
                if (prev !== id) {
                  setLiveMessages([])
                  nextSeqRef.current = 1
                }
                return id
              })
            }}
            onUserMessage={(content: string) => {
              console.log('[ChatWindow] onUserMessage()', { contentLen: content.length, content })
              setLastEvent('append(user)')
              const createdAt = new Date()
              const seq = nextSeqRef.current++
              setLiveMessages((prev) => prev.concat({ id: safeId(), role: 'user', content, createdAt, seq }))
            }}
            onAssistantMessage={(content: string) => {
              console.log('[ChatWindow] onAssistantMessage()', { contentLen: content.length, content })
              setLastEvent('append(assistant)')
              const createdAt = new Date()
              const seq = nextSeqRef.current++
              setLiveMessages((prev) => prev.concat({ id: safeId(), role: 'assistant', content, createdAt, seq }))
            }}
            filters={{
              account: accountValueForApi,
              period: periodValueForApi,
            }}
            filtersSlot={
              <div className="chatFiltersRow" style={{ justifyContent: 'flex-start' }}>
                <button
                  type="button"
                  className={`chatFilterPill ${accountFilter ? 'chatFilterPillActive' : ''}`}
                  onClick={() => setPicker('account')}
                >
                  {accountLabel}
                </button>

                <button
                  type="button"
                  className={`chatFilterPill ${periodValueForApi ? 'chatFilterPillActive' : ''}`}
                  onClick={() => setPicker('period')}
                  style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {periodLabel}
                </button>
              </div>
            }
          />
        </div>
      </div>

      <Modal
        isOpen={picker === 'account'}
        title="Choose account"
        onClose={() => setPicker(null)}
      >
        <div style={{ display: 'grid', gap: 10 }}>
          {[{ v: '', label: 'Use profile default' }, { v: 'josh', label: 'Josh' }, { v: 'joint', label: 'Joint' }, { v: 'anna', label: 'Anna' }].map(
            (o) => (
              <button
                key={o.v || 'default'}
                type="button"
                className="tt-btn"
                onClick={() => {
                  setAccountFilter(o.v as Account | '')
                  setPicker(null)
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#e6eef8',
                  fontWeight: 800,
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                {o.label}
              </button>
            )
          )}
        </div>
      </Modal>

      <Modal
        isOpen={picker === 'period'}
        title="Choose statement period"
        onClose={() => setPicker(null)}
      >
        <div style={{ display: 'grid', gap: 10 }}>
          <button
            type="button"
            onClick={() => {
              setPeriodFilter('')
              setPicker(null)
            }}
            style={{
              padding: '12px 14px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.12)',
              background: !periodFilter ? 'rgba(37,99,235,0.20)' : 'rgba(255,255,255,0.04)',
              color: '#e6eef8',
              fontWeight: 800,
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            Any period
          </button>

          {periodOptions.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPeriodFilter(p)
                setPicker(null)
              }}
              style={{
                padding: '12px 14px',
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.12)',
                background: p === periodFilter ? 'rgba(37,99,235,0.20)' : 'rgba(255,255,255,0.04)',
                color: '#e6eef8',
                fontWeight: 800,
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </Modal>
    </>
  )
}
