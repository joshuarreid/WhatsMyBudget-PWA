import { useEffect, useMemo, useRef, useState } from 'react'
import { useAskRag } from '../hooks/useConversations'
import { useProfileStore } from '@/store/useProfileStore'

export interface ChatInputFilters {
  period?: string
  payment_method?: string
  /** Optional explicit account override (if omitted, falls back to active profile). */
  account?: string
}

interface ChatInputProps {
  conversationId: string | null
  onConversationId: (conversationId: string) => void
  onUserMessage: (content: string) => void
  onAssistantMessage: (content: string) => void
  onSendingChange?: (isSending: boolean) => void
  filters?: ChatInputFilters
  filtersSlot?: React.ReactNode
  disabled?: boolean
}

const isNonEmpty = (s: string) => s.trim().length > 0

export function ChatInput({
  conversationId,
  onConversationId,
  onUserMessage,
  onAssistantMessage,
  onSendingChange,
  filters,
  filtersSlot,
  disabled,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState('')

  // Default account = current active profile in the app.
  const activeProfileAccount = useProfileStore((s) => s.profile)
  const account = filters?.account ?? activeProfileAccount

  const askRag = useAskRag()
  const isSending = askRag.isPending

  useEffect(() => {
    onSendingChange?.(isSending)
  }, [isSending, onSendingChange])

  const canSend = useMemo(() => {
    if (disabled) return false
    if (isSending) return false
    return isNonEmpty(value)
  }, [disabled, isSending, value])

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return

    el.style.height = '0px'
    const next = Math.min(el.scrollHeight, 140)
    el.style.height = `${next}px`

    // Prevent the small right-side scrollbar in the pill.
    // Only allow scrolling if the content exceeds our max height.
    el.style.overflowY = el.scrollHeight > 140 ? 'auto' : 'hidden'
  }, [value])

  const send = async () => {
    const question = value.trim()
    if (!question) return

    console.log('[ChatInput] send()', {
      conversationId,
      question,
      account,
      filters,
    })

    setValue('')
    console.log('[ChatInput] onUserMessage()', { question })
    onUserMessage(question)

    try {
      const response = await askRag.mutateAsync({
        request: {
          question,
          conversation_id: conversationId ?? undefined,
          account,
          period: filters?.period,
          payment_method: filters?.payment_method,
        },
      })

      console.log('[ChatInput] askRag response', response)

      if (!conversationId && response.conversation_id) {
        console.log('[ChatInput] onConversationId()', { conversation_id: response.conversation_id })
        onConversationId(response.conversation_id)
      }

      console.log('[ChatInput] onAssistantMessage()', { answerLen: response.answer?.length })
      onAssistantMessage(response.answer)
    } catch (err) {
      console.error('[ChatInput] askRag error', err)
      onAssistantMessage('Sorry — something went wrong sending that. Please try again.')
    } finally {
      textareaRef.current?.focus()
    }
  }

  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 30,
        paddingTop: 8,
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        // A subtle gradient so the transcript scrolls under the input nicely.
        background:
          'linear-gradient(180deg, rgba(15,17,21,0), rgba(15,17,21,0.92) 14px, rgba(15,17,21,1))',
        backdropFilter: 'blur(6px)',
      }}
    >
      {filtersSlot ? <div style={{ marginBottom: 8 }}>{filtersSlot}</div> : null}

      <div
        className="tt-card"
        style={{
          padding: 10,
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 10,
          alignItems: 'end',
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={isSending ? 'Sending…' : 'Ask about your budget…'}
          disabled={disabled || isSending}
          rows={1}
          style={{
            width: '100%',
            resize: 'none',
            overflowY: 'hidden',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.03)',
            color: '#e6eef8',
            padding: '10px 12px',
            lineHeight: 1.35,
            outline: 'none',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (canSend) void send()
            }
          }}
        />

        <button
          type="button"
          onClick={() => void send()}
          disabled={!canSend}
          style={{
            padding: '10px 14px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.12)',
            background: canSend ? 'rgba(37,99,235,0.95)' : 'rgba(255,255,255,0.06)',
            color: canSend ? '#ffffff' : 'rgba(230,238,248,0.55)',
            fontWeight: 800,
            cursor: canSend ? 'pointer' : 'not-allowed',
            minHeight: 40,
          }}
        >
          Send
        </button>
      </div>

      {askRag.isError ? (
        <div style={{ marginTop: 6, color: 'rgba(255, 170, 170, 0.9)', fontSize: 13 }}>
          Send failed. You can try again.
        </div>
      ) : null}
    </div>
  )
}
