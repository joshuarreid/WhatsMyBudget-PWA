import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useCurrentRoute, navigate } from '../../../pages/router'
import { session } from '../api/session.ts'

export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const route = useCurrentRoute()

  useEffect(() => {
    if (route === '/login') return
    if (!session.isAuthenticated()) {
      navigate('/login')
    }
  }, [route])

  if (route !== '/login' && !session.isAuthenticated()) return null

  return <>{children}</>
}

