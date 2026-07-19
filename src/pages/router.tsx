import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'

// Simple router for getting started - replace with react-router-dom for production
type Route = '/' | '/dashboard' | '/login' | '/spending-averages' | '/chat'

let currentRoute: Route = (window.location.pathname as Route) || '/'
const listeners: Array<() => void> = []

export const navigate = (route: Route) => {
  currentRoute = route
  window.history.pushState({}, '', route)
  listeners.forEach((listener) => listener())
}

export const useNavigate = () => navigate

export const useCurrentRoute = (): Route => {
  const [route, setRoute] = useState<Route>(currentRoute)

  useEffect(() => {
    const listener = () => setRoute(currentRoute)
    listeners.push(listener)
    return () => {
      const index = listeners.indexOf(listener)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  return route
}

interface RouterProps {
  children: ReactNode
}

export const Router = ({ children }: RouterProps) => {
  useEffect(() => {
    const handlePopState = () => {
      currentRoute = window.location.pathname as Route
      listeners.forEach((listener) => listener())
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return <>{children}</>
}
