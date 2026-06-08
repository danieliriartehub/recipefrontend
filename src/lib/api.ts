/**
 * api.ts — Capa de datos del frontend RECIPE.
 *
 * Todas las operaciones se realizan a través del backend FastAPI (Railway)
 * usando JWT Bearer tokens emitidos por Supabase.
 *
 * El cliente Supabase se importa ÚNICAMENTE para obtener el token de sesión
 * y para la RPC generate_qr_token (que aún no tiene endpoint en el backend).
 */

import { supabase } from '@/lib/supabase'
import { backendApi } from '@/lib/backendApi'

// ─── Helper: obtener token activo ─────────────────────────────────────────────

async function getToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('No autenticado')
  return session.access_token
}

// ─── CENTROS ──────────────────────────────────────────────────────────────────

export async function getCenters() {
  return backendApi.get<unknown[]>('/api/v1/centers/')
}

export async function getCenterById(id: string) {
  return backendApi.get<unknown>(`/api/v1/centers/${id}`)
}

export async function getAvailableCenters() {
  return backendApi.get<unknown[]>('/api/v1/centers/available')
}

export async function getCentersByMaterial(material: string) {
  return backendApi.get<unknown[]>(
    `/api/v1/centers/by-material?material=${encodeURIComponent(material)}`
  )
}

export async function searchCenters(params: {
  campus?: string
  material?: string
  onlyActive?: boolean
}) {
  const qs = new URLSearchParams()
  if (params.campus)    qs.set('campus', params.campus)
  if (params.material)  qs.set('material', params.material)
  if (params.onlyActive !== undefined) qs.set('only_active', String(params.onlyActive))
  return backendApi.get<unknown[]>(`/api/v1/centers/search?${qs.toString()}`)
}

// ─── WALLET ───────────────────────────────────────────────────────────────────

/** Fuente única de balance — lee de la vista user_balance */
export async function getUserBalance(_userId: string) {
  const token = await getToken()
  return backendApi.withToken(token).get<{
    user_id: string
    current_balance: number
    total_earned: number
    total_spent: number
    total_kg: number
    co2_saved_kg: number
    streak_days: number
    total_recyclings: number
  }>('/api/v1/wallet/balance')
}

/** Historial unificado con limit opcional */
export async function getWalletHistory(_userId: string, limit = 20) {
  const token = await getToken()
  return backendApi.withToken(token).get<unknown[]>(
    `/api/v1/wallet/history?limit=${limit}`
  )
}

/** Últimas 5 transacciones para Profile */
export async function getRecentTransactions(_userId: string) {
  return getWalletHistory(_userId, 5)
}

/** @deprecated Usar getUserBalance en su lugar */
export async function getUserWallet(_userId: string) {
  const data = await getUserBalance(_userId)
  return data?.current_balance ?? 0
}

/** @deprecated Usar getWalletHistory en su lugar */
export async function getRecentWalletTransactions(_userId: string) {
  return getWalletHistory(_userId, 5)
}

/** @deprecated Usar getWalletHistory en su lugar */
export async function getWalletEntries(_userId: string) {
  return getWalletHistory(_userId)
}

/** @deprecated Usar getUserBalance en su lugar */
export async function getWalletBalance(_userId: string) {
  const data = await getUserBalance(_userId)
  return data?.current_balance ?? 0
}

export async function softDeleteWalletEntry(id: string) {
  const token = await getToken()
  return backendApi.withToken(token).delete(`/api/v1/wallet/entries/${id}`)
}

// ─── RECICLAJES ───────────────────────────────────────────────────────────────

export async function getRecyclings(_userId: string) {
  const token = await getToken()
  return backendApi.withToken(token).get<unknown[]>('/api/v1/recyclings/')
}

export async function insertRecycling(params: {
  user_id: string
  center_id: string
  material: string
  kg: number
  points_earned: number
  co2_saved_kg: number
}) {
  const token = await getToken()
  return backendApi.withToken(token).post<unknown>('/api/v1/recyclings/', params)
}

// ─── NOTIFICACIONES ───────────────────────────────────────────────────────────

export async function getNotifications(_userId: string) {
  const token = await getToken()
  return backendApi.withToken(token).get<unknown[]>('/api/v1/notifications/')
}

export async function markNotificationRead(id: string) {
  const token = await getToken()
  return backendApi.withToken(token).patch<unknown>(`/api/v1/notifications/${id}/read`)
}

export async function markAllNotificationsRead(_userId: string) {
  const token = await getToken()
  return backendApi.withToken(token).post<unknown>('/api/v1/notifications/read-all')
}

// ─── CUPONES ──────────────────────────────────────────────────────────────────

export async function getUserCoupons(_userId: string) {
  const token = await getToken()
  return backendApi.withToken(token).get<unknown[]>('/api/v1/marketplace/coupons')
}

export async function redeemReward(userId: string, rewardId: string, _code: string) {
  const token = await getToken()
  return backendApi.withToken(token).post<unknown>('/api/v1/marketplace/redeem', {
    user_id: userId,
    reward_id: rewardId,
  })
}

// ─── REWARDS / MARKETPLACE ────────────────────────────────────────────────────

export async function getRewards() {
  return backendApi.get<unknown[]>('/api/v1/marketplace/rewards')
}

export async function getMarketItems() {
  return backendApi.get<unknown[]>('/api/v1/marketplace/items')
}

export async function getMarketItemById(id: string) {
  return backendApi.get<unknown>(`/api/v1/marketplace/items/${id}`)
}

// ─── MISIONES ─────────────────────────────────────────────────────────────────

export async function getMissionsWithProgress(_userId: string) {
  const token = await getToken()
  return backendApi.withToken(token).get<unknown[]>('/api/v1/missions/')
}

export async function completeMission(_userId: string, missionId: string) {
  const token = await getToken()
  return backendApi.withToken(token).post<unknown>(`/api/v1/missions/${missionId}/complete`)
}

// ─── BADGES ───────────────────────────────────────────────────────────────────

export async function getBadgesWithStatus(_userId: string) {
  const token = await getToken()
  return backendApi.withToken(token).get<unknown[]>('/api/v1/missions/badges')
}

// ─── CHALLENGES ───────────────────────────────────────────────────────────────

export async function getChallengesWithProgress(_userId: string) {
  const token = await getToken()
  return backendApi.withToken(token).get<unknown[]>('/api/v1/missions/challenges')
}

// ─── RANKING ──────────────────────────────────────────────────────────────────

export async function getUniversityRankings() {
  return backendApi.get<unknown[]>('/api/v1/rankings/universities')
}

export async function getWeeklyLeaders() {
  return backendApi.get<unknown[]>('/api/v1/rankings/weekly')
}

// ─── QR TOKENS ───────────────────────────────────────────────────────────────
//
// El backend (aliados) expone validate-qr pero no generate-qr aún.
// Se mantiene la llamada RPC directa a Supabase como fallback temporal.

export async function generateQrToken(userId: string) {
  const { data, error } = await supabase
    .rpc('generate_qr_token', { p_user_id: userId })
  if (error) throw error
  return data as {
    token: string
    payload: {
      user_id: string
      full_name: string
      qr_code: string
      points: number
      expires_at: string
      issued_at: string
    }
    expires_at: string
    expires_in: number
  }
}

// ─── PERFIL ───────────────────────────────────────────────────────────────────

export async function updateProfile(_userId: string, updates: {
  full_name?: string
  username?: string
  career?: string
  university_id?: string
  weekly_goal_kg?: number
}) {
  const token = await getToken()
  return backendApi.withToken(token).patch<unknown>('/api/v1/profiles/me', updates)
}

// ─── ESCANEOS ─────────────────────────────────────────────────────────────────

export async function insertScan(params: {
  user_id: string
  item_name: string
  material: string
  recyclable: boolean
  confidence: number
  tip: string
  nearest_center_id: string
  estimated_points: number
  image_url?: string
}) {
  const token = await getToken()
  return backendApi.withToken(token).post<unknown>('/api/v1/scans/', params)
}

export async function getScanHistory(_userId: string) {
  const token = await getToken()
  return backendApi.withToken(token).get<unknown[]>('/api/v1/scans/')
}
