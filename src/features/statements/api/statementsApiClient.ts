import { ApiClient, apiClient } from '../../../api/ApiClient.ts'

export class StatementsApiClient extends ApiClient {
  private basePath = '/api/v2/statements'

  constructor(client: ApiClient) {
    super()
    Object.assign(this, client)
  }

  getBasePath() {
    return this.basePath
  }
}

export const statementsApiClient = new StatementsApiClient(apiClient)

