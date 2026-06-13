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

export async function getActiveCoupons() {
  const token = await getToken()
  return backendApi.withToken(token).get<unknown[]>('/api/v1/coupons/active')
}

export async function getUsedCoupons() {
  const token = await getToken()
  return backendApi.withToken(token).get<unknown[]>('/api/v1/coupons/history')
}

export async function getExpiredCoupons() {
  const token = await getToken()
  return backendApi.withToken(token).get<unknown[]>('/api/v1/coupons/expired')
}

export async function redeemReward(userId: string, rewardId: string, _code: string) {
  const token = await getToken()
  return backendApi.withToken(token).post<unknown>('/api/v1/marketplace/coupons', {
    reward_id: rewardId,
    code,
  })
}

// ─── MARKETPLACE ──────────────────────────────────────────────────────────────

export interface MarketplaceMerchantOut {
  id: string;
  name: string;
  logo_url: string | null;
}

export interface MarketplaceProductListOut {
  id: string;
  name: string;
  short_description: string | null;
  points: number;
  category: string | null;
  image_url: string | null;
  merchant: MarketplaceMerchantOut;
  featured: boolean;
}

export interface MarketplaceProductOut extends MarketplaceProductListOut {
  description: string | null;
  stock: number | null;
  available_from: string | null;
  available_until: string | null;
  terms_and_conditions: string | null;
  redemption_instructions: string | null;
}

export async function getMarketplaceCategories() {
  const token = await getToken()
  // This endpoint might not require auth, but we send token if available
  return backendApi.withToken(token).get<string[]>('/api/v1/marketplace/categories')
}

export async function getMarketplaceProducts(params?: {
  search_query?: string;
  merchant_partner_id?: string;
  category?: string;
  featured?: boolean;
}) {
  const token = await getToken()
  let queryStr = ""
  if (params) {
    const searchParams = new URLSearchParams()
    if (params.search_query) searchParams.set("search_query", params.search_query)
    if (params.merchant_partner_id) searchParams.set("merchant_partner_id", params.merchant_partner_id)
    if (params.category && params.category !== "Todos") searchParams.set("category", params.category)
    if (params.featured !== undefined) searchParams.set("featured", String(params.featured))
    const q = searchParams.toString()
    if (q) queryStr = `?${q}`
  }
  return backendApi.withToken(token).get<MarketplaceProductListOut[]>(`/api/v1/marketplace/products${queryStr}`)
}

export async function getMarketplaceProductById(id: string) {
  const token = await getToken()
  return backendApi.withToken(token).get<MarketplaceProductOut>(`/api/v1/marketplace/products/${id}`)
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

// ─── PUBLICIDAD ───────────────────────────────────────────────────────────────

export async function getActiveBanners() {
  return backendApi.get<{id: string, merchant_partner_id: string, title?: string, business_name: string, banner_url: string, link_url?: string, display_order: number}[]>('/api/v1/aliados/banners')
}

export async function getTargetedBanner() {
  const token = await getToken()
  return backendApi.withToken(token).get<{id: string, merchant_partner_id: string, title?: string, banner_url: string, link_url?: string, is_active: boolean, display_order: number, is_ml_targeted?: boolean}>('/api/v1/aliados/banners/target')
}

export async function trackBanner(bannerId: string, action: 'view' | 'click') {
  const token = await getToken()
  return backendApi.withToken(token).post<{success: boolean}>('/api/v1/aliados/banners/track', {
    banner_id: bannerId,
    action
  })
}

