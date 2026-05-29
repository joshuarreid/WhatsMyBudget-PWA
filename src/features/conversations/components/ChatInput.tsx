import { useEffect, useMemo, useRef, useState } from 'react'
import { useAskRag } from '../hooks/useConversations'
import { useProfileStore } from '@/store/useProfileStore'

export interface ChatInputFilters {
  period?: string
  periodRange?: {
    start: string
    end: string
  }
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

const SendIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path
      d="M4 11.5 19.5 4l-4.6 16-3.5-5.1L4 11.5Z"
      fill="currentColor"
      opacity="0.92"
    />
    <path
      d="M10.9 14.8 19.5 4"
      fill="none"
      stroke="rgba(15, 23, 42, 0.34)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

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
    const requestQuestion = filters?.periodRange
      ? `For statement periods ${filters.periodRange.start} through ${filters.periodRange.end}, ${question}`
      : question

    console.log('[ChatInput] send()', {
      conversationId,
      question: requestQuestion,
      account,
      filters,
    })

    setValue('')
    console.log('[ChatInput] onUserMessage()', { question })
    onUserMessage(question)

    try {
      const response = await askRag.mutateAsync({
        request: {
          question: requestQuestion,
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
      {filtersSlot ? <div className="chatComposerFilters">{filtersSlot}</div> : null}

      <div className="chatComposerShell">
        <div className="chatComposerInputRow">
          <textarea
            ref={textareaRef}
            className="chatComposerTextarea"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={isSending ? 'Sending…' : 'Ask about your budget…'}
            disabled={disabled || isSending}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (canSend) void send()
              }
            }}
          />

          <button
            type="button"
            className={`chatComposerSend ${canSend ? 'chatComposerSendActive' : ''}`}
            onClick={() => void send()}
            disabled={!canSend}
            aria-label="Send message"
            title="Send message"
          >
            <SendIcon />
          </button>
        </div>
      </div>

      {askRag.isError ? (
        <div className="chatComposerError">
          Send failed. You can try again.
        </div>
      ) : null}
    </div>
  )
}
