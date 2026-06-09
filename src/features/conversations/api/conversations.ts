import { conversationsApiClient } from './conversationsApiClient.ts'
import type { AskRagRequest, AskRagResponse, ConversationHistoryResponse } from './conversations.types.ts'
import { config } from '@/config/env'

const MAX_LIMIT = 200
const DEFAULT_LIMIT = 50

type AgentChatCompletionResponse = {
  id?: string
  choices?: Array<{
    delta?: {
      content?: string
    }
    message?: {
      content?: string | Array<{ type?: string; text?: string }>
    }
  }>
}

const parseAgentAnswer = (response: AgentChatCompletionResponse): string => {
  const firstChoice = response.choices?.[0]
  if (!firstChoice) return ''

  const deltaContent = firstChoice.delta?.content
  if (typeof deltaContent === 'string' && deltaContent.trim()) return deltaContent

  const messageContent = firstChoice.message?.content
  if (Array.isArray(messageContent)) {
    return messageContent.map((part) => part.text ?? '').join('').trim()
  }

  return typeof messageContent === 'string' ? messageContent : ''
}

const clampLimit = (limit?: number) => {
  if (typeof limit !== 'number' || Number.isNaN(limit)) return DEFAULT_LIMIT
  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(limit)))
}

export const askAgent = async (
  request: AskRagRequest,
  options?: { headers?: Record<string, string> }
): Promise<AskRagResponse> => {
  const authHeader = config.agentAccessKey ? { Authorization: `Bearer ${config.agentAccessKey}` } : {}
  const messages = request.messages?.length
    ? request.messages
    : [{ role: 'user' as const, content: request.question }]

  const response = await conversationsApiClient.post<AgentChatCompletionResponse>(
    conversationsApiClient.getBasePath(),
    {
      messages,
      stream: false,
      include_functions_info: false,
      include_retrieval_info: false,
      include_guardrails_info: false,
      provide_citations: true,
    },
    { headers: { ...authHeader, ...options?.headers } }
  )

  const answer = parseAgentAnswer(response.data)

  return {
    conversation_id: request.conversation_id ?? response.data.id ?? '',
    answer,
    question: request.question,
    period: request.period,
  }
}

// Backward-compatible alias while call sites migrate naming.
export const askRag = askAgent

export const fetchConversationHistory = async (
  conversationId: string,
  limit?: number
): Promise<ConversationHistoryResponse> => {
  // DigitalOcean agent chat-completions endpoint is stateless from the client perspective.
  // Keep API compatibility for existing UI by returning an empty history shape.
  void clampLimit(limit)
  return {
    conversation_id: conversationId,
    messages: [],
  }
}

