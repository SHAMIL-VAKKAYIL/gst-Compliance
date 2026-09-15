import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RegisterForm } from '../components/auth/RegisterForm'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/client'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleRegister(email: string, password: string) {
    setLoading(true)
    setError(null)
    try {
      await register(email, password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setError(formatAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create account</h1>
        <p className="muted">Registration returns a user id only — sign in afterward to get tokens.</p>
        {success ? (
          <div className="banner banner-ok">Account created. Redirecting to login…</div>
        ) : (
          <RegisterForm onSubmit={handleRegister} loading={loading} error={error} />
        )}
        <p className="auth-footer">
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}

function formatAuthError(err: unknown): string {
  if (err instanceof ApiError) {
    return err.message
  }
  if (err instanceof TypeError) {
    return 'Could not reach the auth API. Is the server running and auth mounted?'
  }
  return err instanceof Error ? err.message : 'Registration failed'
}
