import { apiFetch, setTokens, setVerifcation } from './client'
import type { AuthTokens } from '../types'

export async function login(email: string, password: string): Promise<AuthTokens> {
  const result = await apiFetch<AuthTokens>('/api/auth/v1/login', {
    method: 'POST',
    data: { email, password },
  })
  setTokens(result.accessToken, result.userId, result.email, result.isVerified)
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
  console.log(result);

  if ('accessToken' in result && result.accessToken) {
    setTokens(result.accessToken, result.userId, result.email, result.isVerified)
  }
  console.log(result);

  return result
}

export async function sendVerificationMail(email: string | null) {
  return apiFetch('/api/auth/v1/send-email', { method: 'POST', data: { email } })
}

export async function verifyEmail(token: string): Promise<{ message: string, verified: boolean }> {
  const res: { message: string, verified: boolean } = await apiFetch('/api/auth/v1/verify-email',
    { method: 'POST', data: { token } })
  console.log(res);
  setVerifcation(res.verified)
  return res
}