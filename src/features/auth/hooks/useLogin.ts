import { useMutation } from '@tanstack/react-query'
import { login } from '../api/auth.ts'
import type { LoginRequest } from '../api/auth.types.ts'
import { tokenStorage } from '../api/tokenStorage.ts'

export const useLogin = () => {
  return useMutation({
    mutationFn: (credentials: LoginRequest) => login(credentials),
    onSuccess: (data) => {
      const expiresAt = Date.now() + data.expiresIn * 1000
      tokenStorage.set({ accessToken: data.accessToken, expiresAt })
    },
  })
}
