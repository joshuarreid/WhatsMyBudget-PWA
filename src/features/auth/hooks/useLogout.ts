import { useCallback } from 'react'
import { session } from '../../../api/auth/session'

export const useLogout = () => {
  return useCallback(() => {
    session.logout(true)
  }, [])
}
