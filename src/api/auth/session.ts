import { tokenStorage } from './tokenStorage'
import { navigate } from '../../pages/router'

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

