/**
 * Cliente HTTP para el backend RECIPE desplegado en Railway (FastAPI).
 * Base URL configurada mediante VITE_API_URL en variables de entorno.
 */

const API_URL = import.meta.env.VITE_API_URL ?? ''

if (!API_URL) {
  console.warn('[RECIPE] VITE_API_URL no está definida. Las llamadas al backend fallarán.')
}

// ─── Tipos de respuesta del backend ──────────────────────────────────────────

export interface BackendUser {
  id: string
  email: string
  full_name: string
  email_confirmed: boolean
}

export interface BackendSession {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: BackendUser
}

export interface LoginResponse extends BackendSession {}

export interface RegisterResponse {
  needs_confirmation: boolean
  session: BackendSession | null
}

export interface MeResponse {
  user: BackendUser
  profile: {
    points: number
    streak_days: number
    co2_saved_kg: number
    level_index: number
  }
}

// ─── Fetch base con manejo de errores ────────────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  if (res.status === 204) return undefined as T

  const body = await res.json().catch(() => ({ detail: res.statusText }))

  if (!res.ok) {
    // FastAPI devuelve errores como { detail: "mensaje" }
    throw new Error(body?.detail ?? `Error ${res.status}`)
  }

  return body as T
}

// ─── Métodos exportados ───────────────────────────────────────────────────────

export const backendApi = {
  /** POST sin token (login, register, forgot-password) */
  post: <T>(path: string, body?: unknown): Promise<T> =>
    apiFetch<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  /** POST con Bearer token (logout) */
  postAuth: <T>(path: string, token: string, body?: unknown): Promise<T> =>
    apiFetch<T>(path, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  /** GET con Bearer token (me) */
  getAuth: <T>(path: string, token: string): Promise<T> =>
    apiFetch<T>(path, {
      headers: { Authorization: `Bearer ${token}` },
    }),
}
