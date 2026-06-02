import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Session, User, RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

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

// ─── Contexto ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  /**
   * Busca el perfil del usuario. Si no existe (usuario nuevo), lo crea
   * automáticamente con valores por defecto.
   */
  const fetchProfile = async (authUser: User) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (!error && data) {
      setProfile(data as Profile)
      return
    }

    // PGRST116 = cero filas devueltas → perfil aún no existe → lo creamos
    if (error?.code === 'PGRST116' || error?.message?.includes('0 rows')) {
      const fullName =
        (authUser.user_metadata?.full_name as string | undefined) ??
        authUser.email?.split('@')[0] ??
        'Usuario'

      const initials = fullName
        .split(' ')
        .filter(Boolean)
        .map((s) => s[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'U'

      const { data: newProfile, error: insertErr } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          full_name: fullName,
          avatar_initials: initials,
          points: 0,
          total_kg: 0,
          co2_saved_kg: 0,
          streak_days: 0,
          level_index: 0,
          weekly_goal_kg: 5,
        })
        .select()
        .single()

      if (insertErr) {
        console.error('[RECIPE] Error al crear perfil (verifica RLS en tabla profiles):', insertErr)
      } else if (newProfile) {
        setProfile(newProfile as Profile)
      }
    } else if (error) {
      console.error('[RECIPE] Error al leer perfil:', error)
    }
  }

  useEffect(() => {
    let mounted = true
    let profileChannel: RealtimeChannel | null = null

    // ── Lee el perfil con reintentos — tolera latencia en F5 ────────────────
    // Supabase puede tardar en restaurar el token al recargar; hasta 2 reintentos
    // de 800ms antes de cerrar sesión.
    const fetchProfile = async (userId: string, retries = 2): Promise<void> => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (!mounted) return

        if (error) {
          if (retries > 0) {
            await new Promise(r => setTimeout(r, 800))
            return fetchProfile(userId, retries - 1)
          }
          console.error('fetchProfile failed after retries:', error.message)
          await supabase.auth.signOut()
          if (mounted) { setSession(null); setUser(null); setProfile(null) }
          return
        }

        if (data && mounted) setProfile(data as Profile)
      } catch (e) {
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 800))
          return fetchProfile(userId, retries - 1)
        }
        console.error('fetchProfile exception:', e)
        if (mounted) {
          await supabase.auth.signOut()
          setSession(null); setUser(null); setProfile(null)
        }
      }
    }

    // ── Realtime: actualiza puntos sin recargar ────────────────────────────
    const subscribeToProfile = (userId: string) => {
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

    // ── ÚNICO punto de inicialización: onAuthStateChange ─────────────────
    // Maneja sesión inicial (INITIAL_SESSION) y todos los cambios.
    // Elimina la necesidad de getSession() que causaba doble llamada.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          await fetchProfile(session.user.id)
          if (profileChannel) supabase.removeChannel(profileChannel)
          subscribeToProfile(session.user.id)
        } else {
          setProfile(null)
          if (profileChannel) { supabase.removeChannel(profileChannel); profileChannel = null }
        }

        // loading se apaga SIEMPRE, pase lo que pase
        if (mounted) setLoading(false)
      }
    )

    // Timeout de seguridad: 10s máximo para no quedar bloqueado sin conexión
    const timeout = setTimeout(() => { if (mounted) setLoading(false) }, 10000)

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearTimeout(timeout)
      if (profileChannel) supabase.removeChannel(profileChannel)
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    return {
      error: error?.message ?? null,
      // Si no hubo error pero session es null → Supabase requiere confirmación de correo
      needsConfirmation: !error && !data.session,
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const refreshProfile = async () => {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    if (data) setProfile(data as Profile)
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
