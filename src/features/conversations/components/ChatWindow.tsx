import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { ChatInput } from './ChatInput'
import { useConversationHistory } from '../hooks/useConversations'
import { useProfileStore } from '@/store/useProfileStore'
import type { Account } from '@/store/useProfileStore'
import { useStatementPeriodStore } from '@/store/useStatementPeriodStore'
import { Modal } from '@/components/Modal'
import { parseStatementPeriod } from '@/utils/statementPeriodWindow'

type UiMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: Date
  seq: number
}

type PeriodFilterMode = 'single' | 'range'

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

const pickerOptionBaseStyle: React.CSSProperties = {
  padding: '12px 14px',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.04)',
  color: '#e6eef8',
  fontWeight: 800,
  textAlign: 'left',
  cursor: 'pointer',
}

const pickerOptionActiveStyle: React.CSSProperties = {
  background: 'rgba(37,99,235,0.20)',
  borderColor: 'rgba(96,165,250,0.26)',
}

const comparePeriods = (a: string, b: string) => {
  const parsedA = parseStatementPeriod(a)
  const parsedB = parseStatementPeriod(b)

  if (!parsedA || !parsedB) return a.localeCompare(b)

  const aValue = parsedA.year * 12 + parsedA.monthIndex
  const bValue = parsedB.year * 12 + parsedB.monthIndex
  return aValue - bValue
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
  const [periodRangeFilter, setPeriodRangeFilter] = useState<{ start: string; end: string } | null>(null)
  const [periodMode, setPeriodMode] = useState<PeriodFilterMode>('single')
  const [draftSinglePeriod, setDraftSinglePeriod] = useState<string>('')
  const [draftPeriodRange, setDraftPeriodRange] = useState<{ start: string; end: string }>({ start: '', end: '' })

  const [picker, setPicker] = useState<null | 'account' | 'period'>(null)

  // Default pills: Account shows placeholder; Period is blank until user selects.
  // (We intentionally do NOT default to the global selected statement period.)

  const accountValueForApi: Account = (accountFilter || activeProfile) as Account

  const accountLabel = useMemo(() => {
    if (accountValueForApi === 'josh') return 'Josh'
    if (accountValueForApi === 'joint') return 'Joint'
    if (accountValueForApi === 'anna') return 'Anna'
    return 'Account'
  }, [accountValueForApi])

  const periodLabel = useMemo(() => {
    if (periodRangeFilter?.start && periodRangeFilter?.end) {
      return `${periodRangeFilter.start} → ${periodRangeFilter.end}`
    }

    return periodFilter || 'Period'
  }, [periodFilter, periodRangeFilter])

  const periodValueForApi: string | undefined = periodRangeFilter ? undefined : (periodFilter || undefined)

  const periodOptions = useMemo(() => {
    const opts = availablePeriods?.length ? availablePeriods : storeSelectedPeriod ? [storeSelectedPeriod] : []
    // Ensure the currently chosen period exists in the list so it can be re-selected
    const withSingle = periodFilter && !opts.includes(periodFilter) ? [periodFilter, ...opts] : opts
    const withRangeStart = periodRangeFilter?.start && !withSingle.includes(periodRangeFilter.start)
      ? [periodRangeFilter.start, ...withSingle]
      : withSingle
    const withRangeEnd = periodRangeFilter?.end && !withRangeStart.includes(periodRangeFilter.end)
      ? [periodRangeFilter.end, ...withRangeStart]
      : withRangeStart
    return [...withRangeEnd].sort(comparePeriods)
  }, [availablePeriods, storeSelectedPeriod, periodFilter, periodRangeFilter])

  const defaultSinglePeriod = periodFilter || periodOptions[0] || ''
  const defaultRangeStart = periodRangeFilter?.start ?? periodOptions[0] ?? ''
  const defaultRangeEnd = periodRangeFilter?.end ?? defaultRangeStart

  const openPeriodPicker = () => {
    setDraftSinglePeriod(defaultSinglePeriod)
    setDraftPeriodRange({
      start: defaultRangeStart,
      end: defaultRangeEnd,
    })
    setPicker('period')
  }

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
            'calc(var(--chat-input-max-height) + max(12px, env(safe-area-inset-bottom)))',
        }}
      >

        {renderRows()}
      </div>

      <div className="chatFixedFooter" style={{ bottom: 0 }}>
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
              periodRange: periodRangeFilter ?? undefined,
            }}
            filtersSlot={
              <div className="chatFiltersRow" style={{ justifyContent: 'flex-start' }}>
                <button
                  type="button"
                  className="chatFilterPill chatFilterPillActive"
                  onClick={() => setPicker('account')}
                >
                  {accountLabel}
                </button>

                <button
                  type="button"
                  className={`chatFilterPill ${periodValueForApi || periodRangeFilter ? 'chatFilterPillActive' : ''}`}
                  onClick={openPeriodPicker}
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
                  ...pickerOptionBaseStyle,
                  ...((o.v ? o.v === accountFilter : !accountFilter) ? pickerOptionActiveStyle : null),
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              type="button"
              onClick={() => setPeriodMode('single')}
              style={{
                ...pickerOptionBaseStyle,
                ...(periodMode === 'single' ? pickerOptionActiveStyle : null),
                textAlign: 'center',
              }}
            >
              Single period
            </button>

            <button
              type="button"
              onClick={() => setPeriodMode('range')}
              style={{
                ...pickerOptionBaseStyle,
                ...(periodMode === 'range' ? pickerOptionActiveStyle : null),
                textAlign: 'center',
              }}
            >
              Period range
            </button>
          </div>


          {periodMode === 'single'
            ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div
                    style={{
                      display: 'grid',
                      gap: 12,
                      padding: 12,
                      borderRadius: 16,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <div style={{ display: 'grid', gap: 8 }}>
                      <span style={{ color: 'rgba(230,255,248,0.72)', fontSize: 13, fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Statement period</span>
                      <select
                        className="tt-proj-input"
                        value={draftSinglePeriod}
                        onChange={(event) => setDraftSinglePeriod(event.target.value)}
                      >
                        {periodOptions.map((p) => (
                          <option key={`single-${p}`} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!draftSinglePeriod) return
                        setPeriodFilter(draftSinglePeriod)
                        setPeriodRangeFilter(null)
                        setPicker(null)
                      }}
                      style={{
                        ...pickerOptionBaseStyle,
                        ...pickerOptionActiveStyle,
                        textAlign: 'center',
                      }}
                    >
                      Apply period
                    </button>
                  </div>
                </div>
              )
            : (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div
                    style={{
                      display: 'grid',
                      gap: 12,
                      padding: 12,
                      borderRadius: 16,
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <div style={{ display: 'grid', gap: 8 }}>
                      <span style={{ color: 'rgba(230,255,248,0.72)', fontSize: 13, fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Start period</span>
                      <select
                        className="tt-proj-input"
                        value={draftPeriodRange.start}
                        onChange={(event) => {
                          const nextStart = event.target.value
                          setDraftPeriodRange((current) => ({
                            start: nextStart,
                            end: current.end && comparePeriods(current.end, nextStart) >= 0 ? current.end : nextStart,
                          }))
                        }}
                      >
                        {periodOptions.map((p) => (
                          <option key={`start-${p}`} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gap: 8 }}>
                      <span style={{ color: 'rgba(230,255,248,0.72)', fontSize: 13, fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase' }}>End period</span>
                      <select
                        className="tt-proj-input"
                        value={draftPeriodRange.end}
                        onChange={(event) => {
                          setDraftPeriodRange((current) => ({
                            start: current.start || event.target.value,
                            end: event.target.value,
                          }))
                        }}
                      >
                        {periodOptions.map((p) => {
                          const disabled = Boolean(draftPeriodRange.start && comparePeriods(p, draftPeriodRange.start) < 0)

                          return (
                            <option key={`end-${p}`} value={p} disabled={disabled}>
                              {p}
                            </option>
                          )
                        })}
                      </select>
                    </div>

                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: 'rgba(37,99,235,0.14)',
                        color: '#dbeafe',
                        fontWeight: 800,
                        fontSize: 14,
                      }}
                    >
                      {draftPeriodRange.start && draftPeriodRange.end
                        ? `${draftPeriodRange.start} → ${draftPeriodRange.end}`
                        : 'Choose a start and end period'}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!draftPeriodRange.start || !draftPeriodRange.end) return
                        setPeriodRangeFilter({
                          start: draftPeriodRange.start,
                          end: draftPeriodRange.end,
                        })
                        setPeriodFilter('')
                        setPicker(null)
                      }}
                      style={{
                        ...pickerOptionBaseStyle,
                        ...pickerOptionActiveStyle,
                        textAlign: 'center',
                      }}
                    >
                      Apply range
                    </button>
                  </div>
                </div>
              )}
        </div>
      </Modal>
    </>
  )
}
