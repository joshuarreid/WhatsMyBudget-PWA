import { useEffect, useMemo, useRef, useState } from 'react'
import { ChatInput } from './ChatInput'
import { useConversationHistory } from '../hooks/useConversations'

type UiMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

const safeId = () => {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
}

const parseCreatedAt = (created_at?: string): Date => {
  if (!created_at) return new Date()
  const d = new Date(created_at)
  return Number.isNaN(d.getTime()) ? new Date() : d
}

const formatTime = (d: Date) =>
  new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(d)

const formatDay = (d: Date) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d)

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

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

  const historyQuery = useConversationHistory(conversationId ?? undefined)
  const transcriptRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    console.log('[ChatWindow] mounted')
  }, [])

  const historyMessages = useMemo<UiMessage[]>(() => {
    if (!historyQuery.data) return []
    return historyQuery.data.messages.map((m) => ({
      id: m.message_id ?? safeId(),
      role: m.role,
      content: m.content,
      createdAt: parseCreatedAt(m.created_at),
    }))
  }, [historyQuery.data])

  // Merge fetched history with optimistic live messages for the current conversation.
  const messages = useMemo(() => {
    // For a brand-new conversation (no id yet), just show live messages.
    if (!conversationId) return liveMessages

    // For an existing conversation, prefer server history + any new live messages.
    // De-dupe by id just in case the server echoes a message we already rendered.
    const byId = new Map<string, UiMessage>()
    for (const m of historyMessages) byId.set(m.id, m)
    for (const m of liveMessages) byId.set(m.id, m)

    return Array.from(byId.values()).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
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

  const title = useMemo(() => 'Chat', [])

  const startNewConversation = () => {
    setConversationId(null)
    setLiveMessages([])
  }

  const renderRows = () => {
    const rows: React.ReactNode[] = []
    let lastDay: string | null = null

    for (const m of messages) {
      const key = dayKey(m.createdAt)
      if (key !== lastDay) {
        lastDay = key
        rows.push(
          <div key={`day-${key}`} className="chatDaySeparatorRow">
            <div className="chatDaySeparator">{formatDay(m.createdAt)}</div>
          </div>
        )
      }

      rows.push(
        <div
          key={m.id}
          className={`chatMessageRow ${m.role === 'user' ? 'chatMessageRowUser' : 'chatMessageRowAssistant'}`}
        >
          <div
            className={`tt-card chatBubble ${m.role === 'user' ? 'chatBubbleUser' : 'chatBubbleAssistant'}`}
          >
            <div className="chatBubbleText">{m.content}</div>
            <div className="chatBubbleMeta">{formatTime(m.createdAt)}</div>
          </div>
        </div>
      )
    }

    return rows
  }

  return (
    <>
      <div
        className="chatPageTitle"
        style={{ display: 'flex', alignItems: 'center', gap: 12 }}
      >
        <div style={{ flex: 1 }}>{title}</div>

        <button
          type="button"
          onClick={startNewConversation}
          aria-label="New conversation"
          title="New conversation"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            color: '#e6eef8',
            fontSize: 18,
            fontWeight: 900,
            cursor: 'pointer',
          }}
        >
          +
        </button>
      </div>

      <div
        ref={transcriptRef}
        className="chatTranscript"
        style={{
          paddingBottom:
            'calc(var(--bottom-nav-height) + var(--chat-input-max-height) + max(12px, env(safe-area-inset-bottom)))',
        }}
      >
        {messages.length === 0 ? (
          <div className="tt-card chatEmptyCard">
            <div className="chatEmptyText">
              Ask a question about your spending, categories, or statement period.
            </div>
          </div>
        ) : null}

        {renderRows()}
      </div>

      {/* Fixed footer: ChatInput stays static above the BottomNav */}
      <div className="chatFixedFooter" style={{ bottom: 'var(--bottom-nav-height)' }}>
        <div className="chatFixedFooterInner">
          <ChatInput
            conversationId={conversationId}
            onConversationId={(id) => {
              console.log('[ChatWindow] setConversationId()', { id })
              setLastEvent('setConversationId')
              setConversationId((prev) => {
                // If we're switching to a new conversation id, drop optimistic messages.
                if (prev !== id) {
                  setLiveMessages([])
                }
                return id
              })
            }}
            onUserMessage={(content: string) => {
              console.log('[ChatWindow] onUserMessage()', { contentLen: content.length, content })
              setLastEvent('append(user)')
              setLiveMessages((prev) =>
                prev.concat({ id: safeId(), role: 'user', content, createdAt: new Date() })
              )
            }}
            onAssistantMessage={(content: string) => {
              console.log('[ChatWindow] onAssistantMessage()', { contentLen: content.length, content })
              setLastEvent('append(assistant)')
              setLiveMessages((prev) =>
                prev.concat({ id: safeId(), role: 'assistant', content, createdAt: new Date() })
              )
            }}
            filtersSlot={
              <div className="chatFiltersRow">
                <div className="chatFilterPill">Filters coming soon</div>
              </div>
            }
          />
        </div>
      </div>
    </>
  )
}
