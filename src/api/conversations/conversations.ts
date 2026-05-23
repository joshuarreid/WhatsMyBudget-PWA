import { conversationsApiClient } from './conversationsApiClient'
import type { AskRagRequest, AskRagResponse, ConversationHistoryResponse } from './conversations.types'

const MAX_LIMIT = 200
const DEFAULT_LIMIT = 50

const clampLimit = (limit?: number) => {
  if (typeof limit !== 'number' || Number.isNaN(limit)) return DEFAULT_LIMIT
  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(limit)))
}

export const askRag = async (
  request: AskRagRequest,
  options?: { headers?: Record<string, string> }
): Promise<AskRagResponse> => {
  const response = await conversationsApiClient.post<AskRagResponse>(
    `${conversationsApiClient.getBasePath()}/ask`,
    request,
    { headers: options?.headers }
  )
  return response.data
}

export const fetchConversationHistory = async (
  conversationId: string,
  limit?: number
): Promise<ConversationHistoryResponse> => {
  const params = new URLSearchParams()
  params.set('limit', String(clampLimit(limit)))

  const response = await conversationsApiClient.get<ConversationHistoryResponse>(
    `${conversationsApiClient.getBasePath()}/conversations/${encodeURIComponent(conversationId)}?${params.toString()}`
  )
  return response.data
}

