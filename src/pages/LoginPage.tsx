import { useNavigate } from './router'
import { LoginForm } from '@/features/auth'

export const LoginPage = () => {
  const navigate = useNavigate()

  const handleLoginSuccess = () => {
    navigate('/')
  }

  return (
    <div style={{ padding: '2rem' }}>
      <LoginForm onSuccess={handleLoginSuccess} />
    </div>
  )
}
