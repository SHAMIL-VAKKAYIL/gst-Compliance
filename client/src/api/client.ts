import axios, { type AxiosRequestConfig } from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

const ACCESS_KEY = 'gst_access_token'
const USER_KEY = 'gst_user_id'
const USER_EMAIL = 'email_id'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getUserId(): string | null {
  return localStorage.getItem(USER_KEY)
}

export function getEmailId(): string | null {
return localStorage.getItem(USER_EMAIL)
}
export function setTokens(accessToken: string, userId: string,email:string): void {
  localStorage.setItem(ACCESS_KEY, accessToken)
  localStorage.setItem(USER_KEY, userId)
  localStorage.setItem(USER_EMAIL, email)
}

export function setAccessToken(accessToken: string): void {
  localStorage.setItem(ACCESS_KEY, accessToken)
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(USER_EMAIL)
}

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})

async function tryRefreshAccessToken(): Promise<string | null> {
  const accessToken = getAccessToken()
  if (!accessToken) return null

  try {
    const res = await api.post<{ accessToken?: string }>('/api/auth/v1/refresh')
    const data = res.data
    if (!data.accessToken) {
      clearTokens()
      return null
    }
    setAccessToken(data.accessToken)
    return data.accessToken
  } catch {
    clearTokens()
    return null
  }
}

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export async function apiFetch<T>(
  path: string,
  options: AxiosRequestConfig & { body?: unknown } = {},
  retry = true,
): Promise<T> {
  const token = getAccessToken()
  const headers = { ...(options.headers ?? {}) }
  const { body, ...axiosOptions } = options

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    const res = await api.request<T>({
      ...axiosOptions,
      url: path,
      headers,
      data: body ?? axiosOptions.data,
      withCredentials: true,
    })

    return res.data
  } catch (error: any) {
    const status = error?.response?.status ?? 500
    const body = error?.response?.data

    if (status === 401 && retry) {
      const refreshed = await tryRefreshAccessToken()
      if (refreshed) {
        return apiFetch<T>(path, options, false)
      }
    }

    const message =
      typeof body === 'object' && body && 'error' in body && typeof (body as { error: unknown }).error === 'string'
        ? (body as { error: string }).error
        : typeof body === 'object' && body && 'message' in body && typeof (body as { message: unknown }).message === 'string'
          ? (body as { message: string }).message
          : `Request failed (${status})`

    throw new ApiError(message, status, body)
  }
}
