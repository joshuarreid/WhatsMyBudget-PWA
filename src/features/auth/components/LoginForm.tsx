import { useState } from 'react'
import type { FormEvent } from 'react'
import { useLogin } from '../hooks/useLogin'

interface LoginFormProps {
  onSuccess?: () => void
}

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [password, setPassword] = useState('')
  const loginMutation = useLogin()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    loginMutation.mutate(
      { password },
      {
        onSuccess: () => {
          onSuccess?.()
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2>Login</h2>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '0.5rem',
            fontSize: '1rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
      </div>
      {loginMutation.isError && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          Login failed. Please check your password.
        </div>
      )}
      <button
        type="submit"
        disabled={loginMutation.isPending}
        style={{
          width: '100%',
          padding: '0.75rem',
          fontSize: '1rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        {loginMutation.isPending ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
