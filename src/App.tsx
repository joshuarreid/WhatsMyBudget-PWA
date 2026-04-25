import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './config/queryClient'
import { Router, useCurrentRoute } from './pages/router'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { RequireAuth } from './features/auth/components/RequireAuth'
import { session } from './api/auth/session'

const Routes = () => {
  const route = useCurrentRoute()

  if (route === '/login') {
    if (session.isAuthenticated()) return <DashboardPage />
    return <LoginPage />
  }

  return (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  )
}

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes />
      </Router>
    </QueryClientProvider>
  )
}
