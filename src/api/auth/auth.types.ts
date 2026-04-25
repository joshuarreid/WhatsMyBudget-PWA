export interface LoginRequest {
  password: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
}

export interface ApiError {
  status: number
  code: string
  message: string
  transactionId?: string
}

