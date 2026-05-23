import { useCallback } from 'react'
import { session } from '../api/session.ts'

export const useLogout = () => {
  return useCallback(() => {
    session.logout(true)
  }, [])
}
