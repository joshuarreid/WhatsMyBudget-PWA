import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './config/queryClient'
import { Router, useCurrentRoute } from './pages/router'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { RequireAuth } from './features/auth/components/RequireAuth'
import { session } from './api/auth/session'
import { BottomNav } from './components/BottomNav'
import { SpendingAveragesPage } from './pages/SpendingAveragesPage'
import { ProfileSwitcher } from './components/ProfileSwitcher'

const Routes = () => {
  const route = useCurrentRoute()

  if (route === '/login') {
    if (session.isAuthenticated()) return <DashboardPage />
    return <LoginPage />
  }

  return (
    <RequireAuth>
      {route === '/spending-averages' ? <SpendingAveragesPage /> : <DashboardPage />}
      <BottomNav />
    </RequireAuth>
  )
}

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes />
        <ProfileSwitcher />
      </Router>
    </QueryClientProvider>
  )
}
