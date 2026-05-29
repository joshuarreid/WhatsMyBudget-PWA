import { useNavigate } from './router'
import { LoginForm } from '@/features/auth'

export const LoginPage = () => {
  const navigate = useNavigate()

  const handleLoginSuccess = () => {
    navigate('/')
  }

  return (
    <div
      style={{
        height: '100%',
        minHeight: '100dvh',
        overflowY: 'auto',
        overflowX: 'hidden',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        padding: '2rem',
      }}
    >
      <LoginForm onSuccess={handleLoginSuccess} />
    </div>
  )
}
