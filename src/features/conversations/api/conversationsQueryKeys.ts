export const conversationsQueryKeys = {
  all: ['conversations'] as const,
  histories: () => [...conversationsQueryKeys.all, 'history'] as const,
  history: (conversationId: string, limit?: number) =>
    [...conversationsQueryKeys.histories(), conversationId, { limit }] as const,
}

