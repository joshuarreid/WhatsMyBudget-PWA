import { useQuery } from '@tanstack/react-query'
import { fetchCurrentStatementPeriod } from '../../../api/cache/cache'
import { cacheQueryKeys } from '../../../api/cache/cacheQueryKeys'

export const useCurrentStatementPeriod = () => {
  return useQuery({
    queryKey: cacheQueryKeys.currentStatementPeriod(),
    queryFn: fetchCurrentStatementPeriod,
    staleTime: 5 * 60 * 1000,
  })
}
