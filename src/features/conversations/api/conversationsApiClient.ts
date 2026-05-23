import { ApiClient, apiClient } from '../../../api/ApiClient.ts'

export class ConversationsApiClient extends ApiClient {
  // The conversations/RAG API is hosted under the same base URL, but with this path prefix.
  private basePath = '/whatsmybudgetrag'

  constructor(client: ApiClient) {
    super()
    Object.assign(this, client)
  }

  getBasePath() {
    return this.basePath
  }
}

export const conversationsApiClient = new ConversationsApiClient(apiClient)
