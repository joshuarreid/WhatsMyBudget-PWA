import { useMemo, useState } from 'react'
import { MainLayout } from '../layouts/MainLayout'
import { ChatInput } from '@/features/conversations/components'

type UiMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export const ChatPage = () => {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<UiMessage[]>([])

  const title = useMemo(() => {
    const firstUser = messages.find((m) => m.role === 'user')
    return firstUser?.content ? 'Chat' : 'Chat'
  }, [messages])

  return (
    <MainLayout>
      <div style={{ display: 'grid', gap: 12 }}>
        <div
          style={{
            fontWeight: 950,
            letterSpacing: '0.02em',
            color: '#e6eef8',
            fontSize: '1.25rem',
          }}
        >
          {title}
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {messages.length === 0 ? (
            <div className="tt-card" style={{ padding: 14 }}>
              <div style={{ color: 'rgba(230, 238, 248, 0.78)', lineHeight: 1.35 }}>
                Ask a question about your spending, categories, or statement period.
              </div>
            </div>
          ) : null}

          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                className="tt-card"
                style={{
                  padding: 12,
                  maxWidth: 'min(680px, 100%)',
                  background:
                    m.role === 'user' ? 'rgba(37,99,235,0.20)' : 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                <div style={{ color: '#e6eef8', whiteSpace: 'pre-wrap', lineHeight: 1.35 }}>
                  {m.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        <ChatInput
          conversationId={conversationId}
          onConversationId={setConversationId}
          onUserMessage={(content) =>
            setMessages((prev) => prev.concat({ id: crypto.randomUUID(), role: 'user', content }))
          }
          onAssistantMessage={(content) =>
            setMessages((prev) => prev.concat({ id: crypto.randomUUID(), role: 'assistant', content }))
          }
          filtersSlot={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {/* Placeholder area: future filters (period, payment method, etc.) */}
              <div
                style={{
                  padding: '6px 10px',
                  borderRadius: 999,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.03)',
                  color: 'rgba(230,238,248,0.70)',
                  fontSize: 13,
                  fontWeight: 650,
                }}
              >
                Filters coming soon
              </div>
            </div>
          }
        />
      </div>
    </MainLayout>
  )
}
