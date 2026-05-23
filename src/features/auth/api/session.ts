import { tokenStorage } from './tokenStorage.ts'
import { navigate } from '../../../pages/router.tsx'

export const session = {
  isAuthenticated(): boolean {
    const stored = tokenStorage.get()
    if (!stored) return false
    return !tokenStorage.isExpired()
  },

  logout(redirectToLogin: boolean = true) {
    tokenStorage.clear()
    if (redirectToLogin) navigate('/login')
  },
}

