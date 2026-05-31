import { supabase } from '@/lib/supabase'

// ─── CENTROS ──────────────────────────────────────────────────────────────────

export async function getCenters() {
  const { data, error } = await supabase
    .from('centers')
    .select('*')
    .order('status')
  if (error) throw error
  return data
}

export async function getCenterById(id: string) {
  const { data, error } = await supabase
    .from('centers')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// ─── WALLET ───────────────────────────────────────────────────────────────────

export async function getUserWallet(userId: string) {
  const { data, error } = await supabase
    .from('user_wallet')
    .select('current_balance')
    .eq('user_id', userId)
    .single()
  if (error) throw error
  return data?.current_balance ?? 0
}

export async function getRecentWalletTransactions(userId: string) {
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5)
  if (error) throw error
  return data ?? []
}

export async function getWalletEntries(userId: string) {
  const { data, error } = await supabase
    .from('wallet_history')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getWalletBalance(userId: string) {
  const { data, error } = await supabase
    .from('user_current_balance')
    .select('current_balance')
    .eq('user_id', userId)
    .single()
  if (error) throw error
  return data?.current_balance ?? 0
}

export async function softDeleteWalletEntry(id: string) {
  const { error } = await supabase
    .from('wallet_entries')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ─── RECICLAJES ───────────────────────────────────────────────────────────────

export async function getRecyclings(userId: string) {
  const { data, error } = await supabase
    .from('recyclings')
    .select('*, centers(name, district)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function insertRecycling(params: {
  user_id: string
  center_id: string
  material: string
  kg: number
  points_earned: number
  co2_saved_kg: number
}) {
  const { data, error } = await supabase
    .from('recyclings')
    .insert(params)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── NOTIFICACIONES ───────────────────────────────────────────────────────────

export async function getNotifications(userId: string) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
  if (error) throw error
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
  if (error) throw error
}

// ─── CUPONES ──────────────────────────────────────────────────────────────────

export async function getUserCoupons(userId: string) {
  const { data, error } = await supabase
    .from('user_coupons')
    .select('*, rewards(*)')
    .eq('user_id', userId)
    .order('redeemed_at', { ascending: false })
  if (error) throw error
  return data
}

export async function redeemReward(userId: string, rewardId: string, code: string) {
  const { data, error } = await supabase
    .from('user_coupons')
    .insert({ user_id: userId, reward_id: rewardId, code })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── REWARDS / MARKETPLACE ────────────────────────────────────────────────────

export async function getRewards() {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('active', true)
    .order('cost_points')
  if (error) throw error
  return data
}

export async function getMarketItems() {
  const { data, error } = await supabase
    .from('market_items')
    .select('*')
    .eq('active', true)
    .order('cost_points')
  if (error) throw error
  return data
}

export async function getMarketItemById(id: string) {
  const { data, error } = await supabase
    .from('market_items')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// ─── MISIONES ─────────────────────────────────────────────────────────────────

export async function getMissionsWithProgress(userId: string) {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('missions')
    .select(`
      *,
      user_missions!left(done, completed_at, period_start)
    `)
    .eq('active', true)
    .eq('user_missions.user_id', userId)
    .eq('user_missions.period_start', today)
  if (error) throw error
  return data
}

export async function completeMission(userId: string, missionId: string) {
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase
    .from('user_missions')
    .upsert({
      user_id: userId,
      mission_id: missionId,
      done: true,
      completed_at: new Date().toISOString(),
      period_start: today,
    })
  if (error) throw error
}

// ─── BADGES ───────────────────────────────────────────────────────────────────

export async function getBadgesWithStatus(userId: string) {
  const { data, error } = await supabase
    .from('badges')
    .select(`
      *,
      user_badges!left(unlocked_at)
    `)
    .eq('user_badges.user_id', userId)
  if (error) throw error
  return data
}

// ─── CHALLENGES ───────────────────────────────────────────────────────────────

export async function getChallengesWithProgress(userId: string) {
  const { data, error } = await supabase
    .from('challenges')
    .select(`
      *,
      user_challenges!left(progress, completed)
    `)
    .eq('active', true)
    .eq('user_challenges.user_id', userId)
  if (error) throw error
  return data
}

// ─── RANKING ──────────────────────────────────────────────────────────────────

export async function getUniversityRankings() {
  const { data, error } = await supabase
    .from('university_rankings')
    .select('*')
    .order('total_kg', { ascending: false })
  if (error) throw error
  return data
}

export async function getWeeklyLeaders() {
  const { data, error } = await supabase
    .from('weekly_leaders')
    .select('*')
    .limit(10)
  if (error) throw error
  return data
}

// ─── PERFIL ───────────────────────────────────────────────────────────────────

export async function updateProfile(userId: string, updates: {
  full_name?: string
  username?: string
  career?: string
  university_id?: string
  weekly_goal_kg?: number
}) {
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw error
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
  const { data, error } = await supabase
    .from('scans')
    .insert(params)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getScanHistory(userId: string) {
  const { data, error } = await supabase
    .from('scans')
    .select('*, centers(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data
}

export async function getCentersByMaterial(material: string) {
  const { data, error } = await supabase
    .from('centers')
    .select('*')
    .contains('accepted_materials', [material])
    .not('status', 'in', '("cerrado","mantenimiento")')
    .order('wait_minutes', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function searchCenters(params: {
  campus?: string
  material?: string
  onlyActive?: boolean
}) {
  let query = supabase.from('centers').select('*')

  if (params.campus) {
    query = query.or(
      `district.ilike.%${params.campus}%,address.ilike.%${params.campus}%`
    )
  }

  if (params.material) {
    query = query.contains('accepted_materials', [params.material])
  }

  if (params.onlyActive !== false) {
    query = query.not('status', 'in', '("cerrado","mantenimiento")')
  }

  query = query.order('capacity', { ascending: true })

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getAvailableCenters() {
  const { data, error } = await supabase
    .from('centers')
    .select('id, name, district, address, lat, lng, status, accepted_materials, hours, wait_minutes, capacity, rating')
    .not('status', 'in', '("cerrado","mantenimiento","lleno")')
    .order('wait_minutes', { ascending: true })
  if (error) throw error
  return data ?? []
}
