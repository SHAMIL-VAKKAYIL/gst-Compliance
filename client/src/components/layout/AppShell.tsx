import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

export function AppShell() {
  const { isAuthenticated, userId, logout } = useAuth()

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <NavLink to="/" className="brand-link">
            GST Compliance
          </NavLink>
        </div>
        <nav className="app-nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/invoices/upload">Upload</NavLink>
          <NavLink to="/invoices">Invoices</NavLink>
        </nav>
        <div className="header-actions">
          {isAuthenticated ? (
            <>
              <span className="user-chip" title={userId ?? undefined}>
                Signed in
              </span>
              <button type="button" className="btn btn-ghost" onClick={logout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="btn btn-ghost">
                Log in
              </NavLink>
              <NavLink to="/register" className="btn btn-primary">
                Register
              </NavLink>
            </>
          )}
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
