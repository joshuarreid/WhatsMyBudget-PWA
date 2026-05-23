import { MainLayout } from '../layouts/MainLayout'

export const ChatPage = () => {
  return (
    <MainLayout>
      <div
        style={{
          display: 'grid',
          gap: 12,
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
          Chat
        </div>

        <div
          className="tt-card"
          style={{
            padding: 14,
          }}
        >
          <div style={{ color: 'rgba(230, 238, 248, 0.78)', lineHeight: 1.35 }}>
            This is a placeholder page. Next we’ll add the chat UI and wire it to the conversations API.
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

