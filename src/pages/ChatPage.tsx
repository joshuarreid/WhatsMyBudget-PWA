import { MainLayout } from '../layouts/MainLayout'
import { ChatWindow } from '@/features/conversations/components'
import './ChatPage.css'

const CHAT_INPUT_MAX_HEIGHT = 210

export const ChatPage = () => {
  return (
    <MainLayout hideStatementPeriodChooser>
      <div
        className="chatPage"
        style={{
          ['--chat-input-max-height' as string]: `${CHAT_INPUT_MAX_HEIGHT}px`,
        }}
      >
        <ChatWindow />
      </div>
    </MainLayout>
  )
}
