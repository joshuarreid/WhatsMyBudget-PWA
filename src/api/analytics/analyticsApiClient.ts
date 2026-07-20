import { ApiClient, apiClient } from '../ApiClient.ts'

export const analyticsBasePath = '/api/v2/analytics'

export class AnalyticsApiClient extends ApiClient {
  constructor(client: ApiClient) {
    super()
    Object.assign(this, client)
  }
}

export const analyticsApiClient = new AnalyticsApiClient(apiClient)
