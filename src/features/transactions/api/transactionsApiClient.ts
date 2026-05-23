import { ApiClient, apiClient } from '../../../api/ApiClient.ts'

export class TransactionsApiClient extends ApiClient {
  private basePath = '/api/v2/transactions'

  constructor(client: ApiClient) {
    super()
    Object.assign(this, client)
  }

  getBasePath() {
    return this.basePath
  }
}

export const transactionsApiClient = new TransactionsApiClient(apiClient)

