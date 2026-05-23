import { useQuery } from '@tanstack/react-query'
import { fetchConversationHistory } from '../../../api/conversations/conversations'
import { conversationsQueryKeys } from '../../../api/conversations/conversationsQueryKeys'

export const useConversationHistory = (conversationId?: string, limit?: number) => {
  return useQuery({
    queryKey: conversationsQueryKeys.history(conversationId ?? '', limit),
    queryFn: () => {
      if (!conversationId) throw new Error('conversationId is required')
      return fetchConversationHistory(conversationId, limit)
    },
    enabled: Boolean(conversationId && conversationId.trim().length > 0),
  })
}

