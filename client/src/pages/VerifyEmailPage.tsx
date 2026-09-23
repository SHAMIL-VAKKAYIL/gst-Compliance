import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { verifyEmail } from '../api/auth'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMessage('No verification token found in the link.')
      return
    }

    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : 'Verification failed')
      })
  }, [token])

  return (
    <div className="auth-page">
      <div className="auth-card">
        {status === 'checking' && <p>Verifying your email…</p>}
        {status === 'success' && (
          <>
            <h1>Email verified</h1>
            <p className="muted">You can now log in.</p>
            <Link to="/" className="btn btn-primary">Go to Home</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h1>Verification failed</h1>
            <p className="form-error">{errorMessage}</p>
          </>
        )}
      </div>
    </div>
  )
}