import { ApiClient, apiClient } from '../ApiClient'

export class ProjectedTransactionsApiClient extends ApiClient {
  private basePath = '/api/v2/projected-transactions'

  constructor(client: ApiClient) {
    super()
    Object.assign(this, client)
  }

  getBasePath() {
    return this.basePath
  }
}

export const projectedTransactionsApiClient = new ProjectedTransactionsApiClient(apiClient)

