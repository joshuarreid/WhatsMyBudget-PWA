import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchConversationHistory, askRag } from '../api/conversations.ts'
import { conversationsQueryKeys } from '../api/conversationsQueryKeys.ts'
import type { AskRagRequest, AskRagResponse } from '../api/conversations.types.ts'

/**
 * React Query hook to fetch conversation history by conversationId.
 * @param conversationId The conversation ID to fetch history for.
 * @param limit Optional limit for number of messages (default handled by API).
 */
export const useConversationHistory = (conversationId?: string, limit?: number) => {
  return useQuery({
    queryKey: conversationsQueryKeys.history(conversationId || '', limit),
    queryFn: () => {
      if (!conversationId) throw new Error('conversationId is required')
      return fetchConversationHistory(conversationId, limit)
    },
    enabled: Boolean(conversationId && conversationId.trim().length > 0),
  })
}

/**
 * React Query mutation hook for askRag.
 */
export const useAskRag = () => {
  return useMutation({
    mutationFn: ({ request, headers }: { request: AskRagRequest; headers?: Record<string, string> }) =>
      askRag(request, { headers }),
  })
}

export type UseAskRagResult = AskRagResponse
