import { authApiClient } from './authApiClient.ts'
import type { LoginRequest, LoginResponse } from './auth.types.ts'

export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await authApiClient.loginRequest<LoginResponse>('/auth/login', credentials)
  return response.data
}
