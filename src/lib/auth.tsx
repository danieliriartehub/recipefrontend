import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User, RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { backendApi, type LoginResponse, type RegisterResponse } from '@/lib/backendApi'

// ─── Helper: token de la sesión activa ────────────────────────────────────────
async function getSessionToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  } catch { return null }
}

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
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...p, _at: Date.now() })) } catch {}
}

function clearCachedProfile() {
  try { sessionStorage.removeItem(CACHE_KEY) } catch {}
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let profileChannel: RealtimeChannel | null = null

    // Mutex — evita que INITIAL_SESSION y SIGNED_IN lancen fetchProfile en paralelo
    let fetchingProfile = false

    // ── Fallback: perfil directo desde Supabase ────────────────────────────
    // Se usa si el backend no está disponible. También crea el perfil si no existe.
    const fetchProfileFromSupabase = async (userId: string): Promise<Profile | null> => {
      try {
        const { data, error } = await supabase
          .from('profiles').select('*').eq('id', userId).single()

        if (!error && data) return data as Profile

        // Perfil no existe (PGRST116 = 0 rows) → crearlo automáticamente
        if (error?.code === 'PGRST116') {
          const { data: { user: authUser } } = await supabase.auth.getUser()
          const fullName = (authUser?.user_metadata?.full_name as string | undefined) ??
            authUser?.email?.split('@')[0] ?? 'Usuario'
          const initials = fullName.split(' ').filter(Boolean)
            .map((s: string) => s[0]).join('').slice(0, 2).toUpperCase() || 'U'

          const { data: newProfile } = await supabase
            .from('profiles')
            .insert({
              id: userId, full_name: fullName, avatar_initials: initials,
              points: 0, total_kg: 0, co2_saved_kg: 0,
              streak_days: 0, level_index: 0, weekly_goal_kg: 5,
            })
            .select().single()

          if (newProfile) return newProfile as Profile
        }
      } catch {}
      return null
    }

    // ── fetchProfile: backend (5s timeout) → Supabase (con auto-creación) ──
    const fetchProfile = async (userId: string) => {
      // 1. Caché instantánea → render en <100ms
      const cached = getCachedProfile(userId)
      if (cached && mounted) {
        setProfile(cached)
        refreshBackground(userId)
        return
      }

      if (fetchingProfile) return
      fetchingProfile = true
      try {
        // 2. Intentar backend (1 intento, 5s timeout)
        try {
          const token = await getSessionToken()
          if (token) {
            const data = await Promise.race([
              backendApi.withToken(token).get<Profile>('/api/v1/profiles/me'),
              new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('backend-timeout')), 5000)
              ),
            ])
            if (data && mounted) {
              setCachedProfile(data)
              setProfile(data)
              return
            }
          }
        } catch (backendErr) {
          console.warn('[RECIPE] Backend no disponible, usando Supabase:', (backendErr as Error).message)
        }

        // 3. Fallback: Supabase directo (auto-crea perfil si no existe)
        if (!mounted) return
        const fallback = await fetchProfileFromSupabase(userId)
        if (fallback && mounted) {
          setCachedProfile(fallback)
          setProfile(fallback)
          return
        }

        if (mounted) setProfile(null)
      } finally {
        fetchingProfile = false
      }
    }

    // Refresco silencioso en background (cuando ya hay caché)
    const refreshBackground = async (userId: string) => {
      if (fetchingProfile) return
      fetchingProfile = true
      try {
        const token = await getSessionToken()
        if (token) {
          try {
            const data = await backendApi.withToken(token).get<Profile>('/api/v1/profiles/me')
            if (data && mounted) { setCachedProfile(data); setProfile(data); return }
          } catch {}
        }
        const fallback = await fetchProfileFromSupabase(userId)
        if (fallback && mounted) { setCachedProfile(fallback); setProfile(fallback) }
      } catch {} finally { fetchingProfile = false }
    }

    // ── Realtime: actualiza puntos sin recargar ────────────────────────────
    const subscribeToProfile = (userId: string) => {
      if (profileChannel) supabase.removeChannel(profileChannel)
      profileChannel = supabase
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

    // ── Lógica compartida: procesar una sesión recibida ───────────────────
    const handleSession = (sess: Session | null) => {
      setSession(sess)
      setUser(sess?.user ?? null)
      if (mounted) setLoading(false)   // ← loading se apaga YA, sin esperar perfil
      if (sess?.user) {
        fetchProfile(sess.user.id)     // fire-and-forget
        subscribeToProfile(sess.user.id)
      }
    }

    // ── PASO 1: onAuthStateChange — se registra PRIMERO ──────────────────
    //
    // IMPORTANTE: 'INITIAL_SESSION' se dispara INMEDIATAMENTE (< 1ms)
    // con la sesión guardada en localStorage, sin hacer ninguna llamada
    // de red. Es la fuente de verdad más rápida en el arranque.
    //
    // Antes solo manejábamos SIGNED_IN → si había tokens guardados,
    // INITIAL_SESSION se ignoraba → session quedaba null → timeout de 8s.
    //
    let authInitialized = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, sess) => {
        if (!mounted) return
        console.log('Auth event:', event)

        if (event === 'INITIAL_SESSION') {
          authInitialized = true
          handleSession(sess)
          return
        }

        if (event === 'SIGNED_IN') {
          handleSession(sess)
          return
        }

        if (event === 'SIGNED_OUT') {
          clearCachedProfile()
          setSession(null); setUser(null); setProfile(null)
          if (profileChannel) { supabase.removeChannel(profileChannel); profileChannel = null }
          if (mounted) setLoading(false)
          return
        }

        if (event === 'TOKEN_REFRESHED') {
          setSession(sess)
        }
      }
    )

    // ── PASO 2: getSession() solo como red de seguridad ───────────────────
    // Si por algún motivo INITIAL_SESSION no disparó (caso extremo),
    // getSession() cierra el gap.
    supabase.auth.getSession().then(({ data: { session: sess }, error }) => {
      if (!mounted || authInitialized) return   // INITIAL_SESSION ya lo resolvió
      if (error) console.error('[RECIPE] getSession error:', error)
      handleSession(sess)
    })

    // ── Timeout de emergencia: 8s ──────────────────────────────────────────
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth timeout — forzando loading false')
        setLoading(false)
      }
    }, 8000)

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearTimeout(timeout)
      if (profileChannel) supabase.removeChannel(profileChannel)
    }
  }, [])

  // ── signIn → backend /api/v1/auth/login ──────────────────────────────────
  const signIn = async (email: string, password: string) => {
    try {
      const data = await backendApi.post<LoginResponse>(
        '/api/v1/auth/login',
        { email, password }
      )
      // El backend devuelve { session: { access_token, refresh_token, … } }
      // Sincronizamos el cliente local de Supabase con esos tokens
      // Esto dispara SIGNED_IN en onAuthStateChange → handleSession → setSession/loading
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })
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
      // Si hay sesión (sin confirmación de correo) la sincronizamos localmente
      if (!data.needs_confirmation && data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
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
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (currentSession?.access_token) {
        await backendApi.postAuth(
          '/api/v1/auth/logout',
          currentSession.access_token
        )
      }
    } catch (e) {
      console.warn('[RECIPE] Backend logout falló, cerrando sesión local igualmente:', e)
    } finally {
      await supabase.auth.signOut()
    }
  }

  const refreshProfile = async () => {
    if (!user) return
    try {
      const token = await getSessionToken()
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
