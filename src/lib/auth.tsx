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
    let profileChannel: RealtimeChannel | null = null

    // Suscripción Realtime al perfil — actualiza puntos sin recargar
    const subscribeToProfile = (userId: string) => {
      profileChannel = supabase
        .channel(`profile:${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${userId}`,
          },
          (payload) => {
            // Usamos el updater funcional para leer el valor actual sin closure stale
            setProfile((prev) => {
              const oldPoints = prev?.points ?? 0
              const newPoints = (payload.new as Profile).points
              const diff = newPoints - oldPoints
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

    // Sesión activa al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user)
        subscribeToProfile(session.user.id)
      }
      setLoading(false)
    })

    // Escucha cambios (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user)
        // Re-suscribir si cambia el usuario (ej. login tras logout)
        if (profileChannel) supabase.removeChannel(profileChannel)
        subscribeToProfile(session.user.id)
      } else {
        setProfile(null)
        if (profileChannel) {
          supabase.removeChannel(profileChannel)
          profileChannel = null
        }
      }
    })

    return () => {
      subscription.unsubscribe()
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
    if (user) await fetchProfile(user)
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
