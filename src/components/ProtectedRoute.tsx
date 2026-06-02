import { useState, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// ── Loader con countdown — auto-redirige si el perfil no carga en 5s ──────
function ProfileLoader({ onGiveUp }: { onGiveUp: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(5)

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(interval)
          onGiveUp()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [onGiveUp])

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm font-medium text-gray-700">
        Cargando tu sesión...
      </p>
      <p className="text-xs text-muted-foreground">
        Redirigiendo en {secondsLeft}s si hay un problema
      </p>
    </div>
  )
}

// ── ProtectedRoute ────────────────────────────────────────────────────────
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth()
  const navigate = useNavigate()

  // Spinner mientras Supabase responde (máx 15s por el timeout del AuthProvider)
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Sin sesión → login
  if (!session) return <Navigate to="/auth" replace />

  // Sesión activa pero perfil aún null — fetchProfile puede estar reintentando.
  // ProfileLoader espera 5s y redirige automáticamente si el perfil no llega.
  if (!profile) {
    return (
      <ProfileLoader
        onGiveUp={async () => {
          await supabase.auth.signOut()
          navigate('/auth', { replace: true })
        }}
      />
    )
  }

  return <>{children}</>
}
