import { conversationsApiClient } from './conversationsApiClient.ts'
import type { AskRagRequest, AskRagResponse, ConversationHistoryResponse } from './conversations.types.ts'
import { config } from '@/config/env'

const MAX_LIMIT = 200
const DEFAULT_LIMIT = 50

type AgentChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>
    }
  }>
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
  const response = await conversationsApiClient.post<AgentChatCompletionResponse>(
    conversationsApiClient.getBasePath(),
    {
      messages: [
        {
          role: 'user',
          content: request.question,
        },
      ],
      stream: false,
      include_functions_info: true,
      include_retrieval_info: true,
      include_guardrails_info: true,
    },
    { headers: { ...authHeader, ...options?.headers } }
  )

  const rawContent = response.data.choices?.[0]?.message?.content
  const answer = Array.isArray(rawContent)
    ? rawContent.map((part) => part.text ?? '').join('')
    : (rawContent ?? '')

  return {
    conversation_id: '',
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

