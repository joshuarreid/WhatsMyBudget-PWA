import { useMemo, useState } from 'react'
import { MainLayout } from '../layouts/MainLayout'
import { ChatInput } from '@/features/conversations/components'

// BottomNav is position: fixed and visually ~56-64px tall.
// Keep ChatInput fixed above it and reserve space so messages don't hide behind the footer.
const BOTTOM_NAV_HEIGHT = 64
const CHAT_INPUT_MAX_HEIGHT = 210

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
      <div
        style={{
          // Create a local "page" layout where only the transcript scrolls.
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
          gap: 12,
          // Fill available viewport, accounting for sticky header area already handled by MainLayout.
          minHeight: 'calc(100vh - 44px - 44px - 2rem)',
        }}
      >
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

        <div
          style={{
            overflowY: 'auto',
            display: 'grid',
            gap: 10,
            // Reserve space so last message isn't hidden under the fixed ChatInput + BottomNav.
            paddingBottom: `calc(${BOTTOM_NAV_HEIGHT}px + ${CHAT_INPUT_MAX_HEIGHT}px + max(12px, env(safe-area-inset-bottom)))`,
          }}
        >
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

        {/* Fixed footer: ChatInput stays static above the BottomNav */}
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: BOTTOM_NAV_HEIGHT,
            zIndex: 60,
            padding: '0 1rem',
            pointerEvents: 'none',
          }}
        >
          <div style={{ maxWidth: '1200px', margin: '0 auto', pointerEvents: 'auto' }}>
            <ChatInput
              conversationId={conversationId}
              onConversationId={setConversationId}
              onUserMessage={(content: string) =>
                setMessages((prev) =>
                  prev.concat({ id: crypto.randomUUID(), role: 'user', content })
                )
              }
              onAssistantMessage={(content: string) =>
                setMessages((prev) =>
                  prev.concat({ id: crypto.randomUUID(), role: 'assistant', content })
                )
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
        </div>
      </div>
    </MainLayout>
  )
}
