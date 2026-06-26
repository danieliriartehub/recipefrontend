import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react'
import { Session, User, RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { backendApi, type LoginResponse, type RegisterResponse, type RefreshResponse } from '@/lib/backendApi'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface Profile {
  id: string
  full_name: string
  username: string | null
  avatar_initials: string | null
  university_id: string | null
  career: string | null
  points: number
  total_kg: number
  co2_saved_kg: number
  streak_days: number
  level_index: number
  weekly_goal_kg: number
  qr_code: string | null
  is_plus: boolean
  plus_expires_at: string | null
}

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  /** needsConfirmation=true cuando Supabase requiere confirmar el correo antes de iniciar sesión */
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null; needsConfirmation: boolean }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

// ─── Caché de perfil en sessionStorage ───────────────────────────────────────
// Nota: sessionStorage es aceptable para el perfil (no es un token de auth).
// Se limpia automáticamente al cerrar la pestaña.

const CACHE_KEY = 'recipe:profile'

function getCachedProfile(userId: string): Profile | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Profile & { _at?: number }
    if (p?.id !== userId) return null
    // Caché válido por 10 minutos
    if (p._at && Date.now() - p._at > 10 * 60 * 1000) return null
    return p
  } catch { return null }
}

function setCachedProfile(p: Profile) {
  try {
    // MEDIO-8: No persistimos is_plus en sessionStorage por seguridad
    const { is_plus, plus_expires_at, ...safeProfile } = p
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...safeProfile, is_plus: false, plus_expires_at: null, _at: Date.now() }))
  } catch {}
}

function clearCachedProfile() {
  try { sessionStorage.removeItem(CACHE_KEY) } catch {}
}

// ─── Constantes de refresco ───────────────────────────────────────────────────
// El access_token de Supabase dura 3600s (1h).
// Refrescamos a los 55 minutos para tener 5 min de margen.
const REFRESH_INTERVAL_MS = 55 * 60 * 1000

// ─── Contexto ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]   = useState<Session | null>(null)
  const [user, setUser]         = useState<User | null>(null)
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [loading, setLoading]   = useState(true)

  // Guardamos el access_token en un ref para que el intervalo de refresco
  // siempre tenga acceso al valor más reciente sin causar re-renders.
  const accessTokenRef = useRef<string | null>(null)
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── silentRefresh: llama al backend para obtener un nuevo access_token ──────
  // El refresh_token viaja automáticamente en la cookie HttpOnly — JS no lo ve.
  const silentRefresh = useCallback(async (): Promise<string | null> => {
    try {
      const data = await backendApi.post<RefreshResponse>('/api/v1/auth/refresh')
      const { access_token, expires_in } = data

      // Sincronizar el cliente Supabase con el nuevo token (solo en memoria)
      await supabase.auth.setSession({
        access_token,
        refresh_token: 'dummy-refresh-token', // requerido por supabase-js, pero el real está en la cookie
      })

      accessTokenRef.current = access_token
      return access_token
    } catch (err) {
      // Cookie expirada o revocada → sesión terminada
      return null
    }
  }, [])

  // ── Iniciar intervalo de refresco automático ──────────────────────────────
  const startRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current)
    refreshTimerRef.current = setInterval(async () => {
      const token = await silentRefresh()
      if (!token) {
        // Si el refresco falla, limpiar sesión localmente
        stopRefreshTimer()
        clearCachedProfile()
        setSession(null); setUser(null); setProfile(null)
        accessTokenRef.current = null
        toast.error('Tu sesión ha expirado', { description: 'Inicia sesión nuevamente.' })
      }
    }, REFRESH_INTERVAL_MS)
  }, [silentRefresh])

  const stopRefreshTimer = () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
  }

  // ── Helper: token activo ─────────────────────────────────────────────────
  const getToken = useCallback(async (): Promise<string | null> => {
    // 1. Usar el token en memoria si existe
    if (accessTokenRef.current) return accessTokenRef.current
    // 2. Si no hay token (recarga de página), intentar refresco silencioso
    return await silentRefresh()
  }, [silentRefresh])

  // ── Perfil desde Supabase (fallback / auto-creación) ────────────────────
  const fetchProfileFromSupabase = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles').select('*').eq('id', userId).single()

      if (!error && data) return data as Profile

      // Perfil no existe (PGRST116 = 0 rows)
      if (error?.code === 'PGRST116') {
        console.warn('[RECIPE] Perfil no encontrado. El backend debe crearlo durante el registro.')
        return null // Ya no se crea desde el frontend
      }
    } catch {}
    return null
  }

  // ── fetchProfile: backend (5s timeout) → Supabase (con auto-creación) ──
  const fetchProfile = async (userId: string, token: string) => {
    // 1. Caché instantánea
    const cached = getCachedProfile(userId)
    if (cached) {
      setProfile(cached)
      // Refrescar en background
      backendApi.withToken(token).get<Profile>('/api/v1/profiles/me')
        .then(data => { if (data) { setCachedProfile(data); setProfile(data) } })
        .catch(() => {})
      return
    }

    // 2. Backend (5s timeout)
    try {
      const data = await Promise.race([
        backendApi.withToken(token).get<Profile>('/api/v1/profiles/me'),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('backend-timeout')), 5000)
        ),
      ])
      if (data) { setCachedProfile(data); setProfile(data); return }
    } catch (err) {
      console.warn('[RECIPE] Backend no disponible, usando Supabase:', (err as Error).message)
    }

    // 3. Fallback: Supabase directo
    const fallback = await fetchProfileFromSupabase(userId)
    if (fallback) { setCachedProfile(fallback); setProfile(fallback) }
    else setProfile(null)
  }

  // ── Realtime: actualiza puntos sin recargar ────────────────────────────
  const profileChannelRef = useRef<RealtimeChannel | null>(null)

  const subscribeToProfile = (userId: string) => {
    if (profileChannelRef.current) supabase.removeChannel(profileChannelRef.current)
    profileChannelRef.current = supabase
      .channel(`profile:${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          setProfile((prev) => {
            const diff = (payload.new as Profile).points - (prev?.points ?? 0)
            if (diff > 0) {
              toast.success(`+${diff} EcoPuntos acreditados 🎉`, {
                description: 'Tu entrega fue registrada exitosamente',
                duration: 5000,
              })
            }
            return payload.new as Profile
          })
        }
      )
      .subscribe()
  }

  // ── Lógica compartida: activar sesión ─────────────────────────────────
  const activateSession = useCallback(async (sess: Session) => {
    accessTokenRef.current = sess.access_token
    setSession(sess)
    setUser(sess.user)
    setLoading(false)
    startRefreshTimer()
    await fetchProfile(sess.user.id, sess.access_token)
    subscribeToProfile(sess.user.id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startRefreshTimer])

  // ── ARRANQUE: intentar reconstitución de sesión desde cookie ─────────
  useEffect(() => {
    let mounted = true

    const bootstrap = async () => {
      // Paso 1: intentar refresco silencioso usando la cookie HttpOnly.
      // Si no hay cookie (primera visita o sesión expirada), retorna null.
      const token = await silentRefresh()

      if (!mounted) return

      if (!token) {
        // No hay sesión activa
        setLoading(false)
        return
      }

      // Paso 2: supabase.auth.getSession() para obtener el objeto Session completo
      // (el setSession del silentRefresh ya lo cargó en memoria)
      const { data: { session: sess } } = await supabase.auth.getSession()
      if (!mounted) return

      if (sess) {
        await activateSession(sess)
      } else {
        setLoading(false)
      }
    }

    bootstrap()

    // Escuchar eventos de Supabase (TOKEN_REFRESHED, SIGNED_OUT, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, sess) => {
        if (!mounted) return

        if (event === 'SIGNED_OUT') {
          stopRefreshTimer()
          clearCachedProfile()
          setSession(null); setUser(null); setProfile(null)
          accessTokenRef.current = null
          if (profileChannelRef.current) {
            supabase.removeChannel(profileChannelRef.current)
            profileChannelRef.current = null
          }
          if (mounted) setLoading(false)
        }

        if (event === 'TOKEN_REFRESHED' && sess) {
          accessTokenRef.current = sess.access_token
          setSession(sess)
        }
      }
    )

    // Timeout de emergencia: 8s
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth timeout — forzando loading false')
        setLoading(false)
      }
    }, 8000)

    return () => {
      mounted = false
      subscription.unsubscribe()
      stopRefreshTimer()
      clearTimeout(timeout)
      if (profileChannelRef.current) supabase.removeChannel(profileChannelRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── signIn → backend /api/v1/auth/login ──────────────────────────────────
  const signIn = async (email: string, password: string) => {
    try {
      const data = await backendApi.post<LoginResponse>(
        '/api/v1/auth/login',
        { email, password }
      )
      // El backend devuelve { session: { access_token, expires_in, user } }
      // El refresh_token fue a la cookie HttpOnly automáticamente.
      // Sincronizamos el cliente local de Supabase con el access_token en memoria.
      const { data: { session: sess }, error } = await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: 'dummy-refresh-token', 
      })
      
      if (error) console.error('[RECIPE] Error seteando sesión en Supabase:', error)

      if (sess) await activateSession(sess)
      return { error: null }
    } catch (e: unknown) {
      return { error: (e as Error).message ?? 'Error de inicio de sesión' }
    }
  }

  // ── signUp → backend /api/v1/auth/register ────────────────────────────────
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const data = await backendApi.post<RegisterResponse>(
        '/api/v1/auth/register',
        { email, password, full_name: fullName }
      )
      // Si hay sesión (sin confirmación de correo), activarla
      if (!data.needs_confirmation && data.session) {
        const { data: { session: sess } } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: 'dummy-refresh-token',
        })
        if (sess) await activateSession(sess)
      }
      return {
        error: null,
        needsConfirmation: data.needs_confirmation,
      }
    } catch (e: unknown) {
      return {
        error: (e as Error).message ?? 'Error de registro',
        needsConfirmation: false,
      }
    }
  }

  // ── signOut → backend /api/v1/auth/logout + limpieza local ───────────────
  const signOut = async () => {
    try {
      const token = accessTokenRef.current
      if (token) {
        // El backend invalida el token en Supabase y borra la cookie HttpOnly
        await backendApi.postAuth('/api/v1/auth/logout', token)
      }
    } catch (e) {
      console.warn('[RECIPE] Backend logout falló, cerrando sesión local igualmente:', e)
    } finally {
      stopRefreshTimer()
      await supabase.auth.signOut()
      // onAuthStateChange('SIGNED_OUT') limpiará el estado
    }
  }

  // ── refreshProfile ────────────────────────────────────────────────────────
  const refreshProfile = async () => {
    if (!user) return
    try {
      const token = await getToken()
      if (!token) return
      const data = await backendApi.withToken(token).get<Profile>('/api/v1/profiles/me')
      if (data) { setCachedProfile(data); setProfile(data) }
    } catch (e) {
      console.warn('[RECIPE] refreshProfile falló:', (e as Error).message)
    }
  }

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
