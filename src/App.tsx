import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './config/queryClient'
import { Router, useCurrentRoute } from './pages/router'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { RequireAuth } from './features/auth/components/RequireAuth'
import { session } from './features/auth/api/session.ts'
import { BottomNav } from './components/BottomNav'
import { SpendingAveragesPage } from './pages/SpendingAveragesPage'
import { ProfileSwitcher } from './components/ProfileSwitcher'
import { ChatPage } from './pages/ChatPage'
/*
routes file
 */
const Routes = () => {
  const route = useCurrentRoute()

  if (route === '/login') {
    if (session.isAuthenticated()) return <DashboardPage />
    return <LoginPage />
  }

  return (
    <RequireAuth>
      {route === '/spending-averages' ? (
        <SpendingAveragesPage />
      ) : route === '/chat' ? (
        <ChatPage />
      ) : (
        <DashboardPage />
      )}
      {route !== '/chat' ? <BottomNav /> : null}
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
