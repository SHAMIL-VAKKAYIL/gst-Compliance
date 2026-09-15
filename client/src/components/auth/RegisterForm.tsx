import { useState, type FormEvent } from 'react'

interface RegisterFormProps {
  onSubmit: (email: string, password: string) => Promise<void>
  loading?: boolean
  error?: string | null
}

export function RegisterForm({ onSubmit, loading, error }: RegisterFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await onSubmit(email.trim(), password)
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <label>
        Email
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label>
        Password
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}
