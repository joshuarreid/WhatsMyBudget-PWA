import { useQuery } from '@tanstack/react-query'
import { fetchStatementPeriods } from '../api/statements.ts'
import { statementsQueryKeys } from '../api/statementsQueryKeys.ts'

export const useStatements = () => {
  return useQuery({
    queryKey: statementsQueryKeys.list(),
    queryFn: fetchStatementPeriods,
  })
}

