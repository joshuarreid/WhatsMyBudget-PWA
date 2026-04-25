import { useMutation } from '@tanstack/react-query'
import { login } from '../../../api/auth/auth'
import type { LoginRequest } from '../../../api/auth/auth.types'
import { tokenStorage } from '../../../api/auth/tokenStorage'

export const useLogin = () => {
  return useMutation({
    mutationFn: (credentials: LoginRequest) => login(credentials),
    onSuccess: (data) => {
      const expiresAt = Date.now() + data.expiresIn * 1000
      tokenStorage.set({ accessToken: data.accessToken, expiresAt })
    },
  })
}
