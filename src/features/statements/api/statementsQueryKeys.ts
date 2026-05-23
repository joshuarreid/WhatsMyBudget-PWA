export const statementsQueryKeys = {
  all: ['statements'] as const,
  lists: () => [...statementsQueryKeys.all, 'list'] as const,
  list: () => [...statementsQueryKeys.lists()] as const,
  details: () => [...statementsQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...statementsQueryKeys.details(), id] as const,
}

