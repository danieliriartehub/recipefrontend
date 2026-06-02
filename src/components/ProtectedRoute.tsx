import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

// ── ProtectedRoute ────────────────────────────────────────────────────────
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth()

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

  // Sesión activa pero perfil null — fetchProfile aún puede estar corriendo.
  // NO auto-redirigir (causa loop). Mostrar spinner + botón de escape manual.
  if (!profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-gray-700">
          Cargando tu perfil...
        </p>
        <p className="text-xs text-muted-foreground">
          Si esto tarda más de 10 segundos, usa el botón de abajo.
        </p>
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            // window.location.replace garantiza redirección sin loop de React Router
            window.location.replace('/auth')
          }}
          className="mt-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-white"
        >
          Cerrar sesión y volver
        </button>
      </div>
    )
  }

  return <>{children}</>
}
