import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth()
  const navigate = useNavigate()

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

  // Sesión activa pero perfil aún cargando (fetchProfile puede estar reintentando)
  // Mostramos spinner en lugar de "Error" para evitar falsos positivos en F5
  if (!profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">
          Cargando tu perfil...
        </p>
        <p className="text-xs text-muted-foreground/60">
          Si esto tarda mucho, intenta recargar la página.
        </p>
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            navigate('/auth', { replace: true })
          }}
          className="mt-2 rounded-full bg-primary px-5 py-2 text-sm font-bold text-white"
        >
          Iniciar sesión de nuevo
        </button>
      </div>
    )
  }

  return <>{children}</>
}
