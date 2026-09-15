import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as authApi from '../api/auth'
import { clearTokens, getAccessToken, getUserId } from '../api/client'
import type { AuthTokens } from '../types'

interface AuthContextValue {
  isAuthenticated: boolean
  userId: string | null
  login: (email: string, password: string) => Promise<AuthTokens>
  register: (email: string, password: string) => Promise<{ userId: string }>
  googleLogin: (idToken: string) => Promise<AuthTokens | { message: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(() => getUserId())
  const [accessToken, setAccessTokenState] = useState<string | null>(() => getAccessToken())

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password)
    setUserId(result.userId)
    setAccessTokenState(result.accessToken)
    return result
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    return authApi.register(email, password)
  }, [])

  const googleLogin = useCallback(async (idToken: string) => {
    const result = await authApi.googleLogin(idToken)
    if ('accessToken' in result && result.accessToken) {
      setUserId(result.userId)
      setAccessTokenState(result.accessToken)
    }
    return result
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    setUserId(null)
    setAccessTokenState(null)
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(accessToken),
      userId,
      login,
      register,
      googleLogin,
      logout,
    }),
    [accessToken, userId, login, register, googleLogin, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
