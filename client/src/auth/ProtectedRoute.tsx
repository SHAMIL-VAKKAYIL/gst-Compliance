import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import type { ReactNode } from 'react'

/** Soft gate: invoice flows work without auth today; use for account-only routes. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return children
}
