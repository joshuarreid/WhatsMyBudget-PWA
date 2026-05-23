import { useMutation } from '@tanstack/react-query'
import { askRag } from '../../../api/conversations/conversations'
import type { AskRagRequest, AskRagResponse } from '../../../api/conversations/conversations.types'

export const useAskRag = () => {
  return useMutation({
    mutationFn: ({ request, headers }: { request: AskRagRequest; headers?: Record<string, string> }) =>
      askRag(request, { headers }),
  })
}

export type UseAskRagResult = AskRagResponse

