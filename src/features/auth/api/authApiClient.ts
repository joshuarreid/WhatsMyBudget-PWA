import { ApiClient } from '../../../api/ApiClient.ts'

export class AuthApiClient extends ApiClient {
  constructor() {
    super()
  }

  // Public endpoints don't need auth token
  public async loginRequest<T>(url: string, data: unknown) {
    return this.post<T>(url, data)
  }
}

export const authApiClient = new AuthApiClient()

