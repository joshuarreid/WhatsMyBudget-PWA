import { useQuery } from '@tanstack/react-query'
import { fetchStatementPeriods } from '../../../api/statements/statements'
import { statementsQueryKeys } from '../../../api/statements/statementsQueryKeys'

export const useStatements = () => {
  return useQuery({
    queryKey: statementsQueryKeys.list(),
    queryFn: fetchStatementPeriods,
  })
}

