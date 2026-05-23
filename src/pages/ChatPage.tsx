import { useMemo, useState } from 'react'
import { MainLayout } from '../layouts/MainLayout'
import { ChatInput } from '@/features/conversations/components'
import './ChatPage.css'

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
        className="chatPage"
        style={{
          // Supply key layout numbers to CSS.
          // (We keep these as constants here until BottomNav exposes its height as a CSS var.)
          ['--bottom-nav-height' as string]: `${BOTTOM_NAV_HEIGHT}px`,
          ['--chat-input-max-height' as string]: `${CHAT_INPUT_MAX_HEIGHT}px`,
        }}
      >
        <div className="chatPageTitle">{title}</div>

        <div
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

          {messages.map((m) => (
            <div
              key={m.id}
              className={`chatMessageRow ${m.role === 'user' ? 'chatMessageRowUser' : 'chatMessageRowAssistant'}`}
            >
              <div
                className={`tt-card chatBubble ${m.role === 'user' ? 'chatBubbleUser' : 'chatBubbleAssistant'}`}
              >
                <div className="chatBubbleText">{m.content}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Fixed footer: ChatInput stays static above the BottomNav */}
        <div className="chatFixedFooter" style={{ bottom: 'var(--bottom-nav-height)' }}>
          <div className="chatFixedFooterInner">
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
                <div className="chatFiltersRow">
                  <div className="chatFilterPill">Filters coming soon</div>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
