import { Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth()

  // Spinner mientras Supabase responde (máx 10s por el timeout del AuthProvider)
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Sin sesión → login
  if (!session) return <Navigate to="/auth" replace />

  // Con sesión pero sin perfil → algo falló (red, RLS, perfil no creado)
  if (!profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Error cargando tu perfil. Por favor inicia sesión de nuevo.
        </p>
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            window.location.href = '/auth'
          }}
          className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-white"
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  return <>{children}</>
}
