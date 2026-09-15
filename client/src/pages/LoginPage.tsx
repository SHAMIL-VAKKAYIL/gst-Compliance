import { useState } from 'react'
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { LoginForm } from '../components/auth/LoginForm'
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../api/client'

export function LoginPage() {
  const { login, googleLogin, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  async function handleLogin(email: string, password: string) {
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(formatAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle(idToken: string) {
    setLoading(true)
    setError(null)
    try {
      const result = await googleLogin(idToken)
      if ('message' in result && !('accessToken' in result)) {
        setError(result.message)
        return
      }
      navigate(from, { replace: true })
    } catch (err) {
      setError(formatAuthError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Log in</h1>
        <p className="muted">
          {/* Auth targets <code>/api/auth/v1</code>. If that router is not mounted yet, sign-in will
          fail until the backend exposes it. */}
        </p>
        <LoginForm onSubmit={handleLogin} loading={loading} error={error} />
        <div className="auth-divider">or</div>
        <GoogleSignInButton onCredential={handleGoogle} disabled={loading} />
        <p className="auth-footer">
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  )
}

function formatAuthError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 404 || err.status === 500) {
      return `${err.message}`
    }
    return err.message
  }
  if (err instanceof TypeError) {
    return ''
  }
  return err instanceof Error ? err.message : 'Login failed'
}
