import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { sendVerificationMail } from '../../api/auth'

export function AppShell() {
  const { isAuthenticated, userId, userEmail, isVerified, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  async function handleSendVerification() {
    try {
      const result = await sendVerificationMail(userEmail)
      // show result.message somehow — a toast, an inline message, your choice
      console.log(result);
      
    } catch {
      // handle failure
    }
  }
  console.log(isVerified);


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
              {isVerified ? (
                <span className="user-chip" title={userId ?? undefined}>
                  {userEmail} <span className="verified-badge" title="Email verified">✓</span>
                </span>
              ) : (
                <span className="user-chip" title={userId ?? undefined}>
                  {userEmail}{' '}
                  <button
                    className="verify-badge-button"
                    onClick={handleSendVerification}
                    title="Click to verify your email"
                  >
                    Not verified — click to verify
                  </button>
                </span>
              )}
              <button type="button" className="btn btn-ghost" onClick={handleLogout}>
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
