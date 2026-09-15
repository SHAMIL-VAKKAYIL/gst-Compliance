import { apiFetch, setTokens } from './client'
import type { AuthTokens } from '../types'

export async function login(email: string, password: string): Promise<AuthTokens> {
  const result = await apiFetch<AuthTokens>('/api/auth/v1/login', {
    method: 'POST',
    data: { email, password },
  })
  setTokens(result.accessToken, result.userId)
  return result
}

export async function register(email: string, password: string): Promise<{ userId: string }> {
  return apiFetch<{ userId: string }>('/api/auth/v1/register', {
    method: 'POST',
    data: { email, password },
  })
}

export async function googleLogin(idToken: string): Promise<AuthTokens | { message: string }> {
  const result = await apiFetch<AuthTokens | { message: string }>('/api/auth/v1/google', {
    method: 'POST',
    data: { idToken },
  })
  if ('accessToken' in result && result.accessToken) {
    setTokens(result.accessToken, result.userId)
  }
  console.log(result);
  
  return result
}
