import { authApiClient } from './authApiClient'
import type { LoginRequest, LoginResponse } from './auth.types'

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await authApiClient.loginRequest<LoginResponse>('/auth/login', credentials)
  return response.data
}
