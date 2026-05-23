import { MainLayout } from '../layouts/MainLayout'
import { ChatWindow } from '@/features/conversations/components'
import './ChatPage.css'

// BottomNav is position: fixed and visually ~56-64px tall.
// Keep ChatInput fixed above it and reserve space so messages don't hide behind the footer.
const BOTTOM_NAV_HEIGHT = 64
const CHAT_INPUT_MAX_HEIGHT = 210

export const ChatPage = () => {
  return (
    <MainLayout hideStatementPeriodChooser>
      <div
        className="chatPage"
        style={{
          // Supply key layout numbers to CSS.
          // (We keep these as constants here until BottomNav exposes its height as a CSS var.)
          ['--bottom-nav-height' as string]: `${BOTTOM_NAV_HEIGHT}px`,
          ['--chat-input-max-height' as string]: `${CHAT_INPUT_MAX_HEIGHT}px`,
        }}
      >
        {/* Title is rendered inside ChatWindow so it can host the + button */}
        <ChatWindow />
      </div>
    </MainLayout>
  )
}
