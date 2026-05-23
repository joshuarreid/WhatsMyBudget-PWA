export interface StatementPeriod {
  id?: string
  periodName: string
  startDate: string
  endDate: string
  isActive?: boolean
}

export interface DeleteAllResponse {
  deletedCount: number
}

