import { statementsApiClient } from './statementsApiClient'
import type { StatementPeriod, DeleteAllResponse } from './statements.types'

export const createStatementPeriod = async (data: StatementPeriod): Promise<StatementPeriod> => {
  const response = await statementsApiClient.post<StatementPeriod>(
    statementsApiClient.getBasePath(),
    data
  )
  return response.data
}

export const fetchStatementPeriods = async (): Promise<StatementPeriod[]> => {
  const response = await statementsApiClient.get<StatementPeriod[]>(
    statementsApiClient.getBasePath()
  )
  return response.data
}

export const fetchStatementPeriodById = async (id: string): Promise<StatementPeriod> => {
  const response = await statementsApiClient.get<StatementPeriod>(
    `${statementsApiClient.getBasePath()}/${id}`
  )
  return response.data
}

export const updateStatementPeriod = async (
  id: string,
  data: StatementPeriod
): Promise<StatementPeriod> => {
  const response = await statementsApiClient.put<StatementPeriod>(
    `${statementsApiClient.getBasePath()}/${id}`,
    data
  )
  return response.data
}

export const deleteStatementPeriod = async (id: string): Promise<void> => {
  await statementsApiClient.delete(`${statementsApiClient.getBasePath()}/${id}`)
}

export const deleteAllStatementPeriods = async (): Promise<DeleteAllResponse> => {
  const response = await statementsApiClient.delete<DeleteAllResponse>(
    statementsApiClient.getBasePath()
  )
  return response.data
}
