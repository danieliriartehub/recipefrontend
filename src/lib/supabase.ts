import { createClient, type SupportedStorage } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local')
}

// ─── Storage en memoria ────────────────────────────────────────────────────────
// Reemplaza el localStorage por defecto de Supabase JS.
// Los tokens (access_token, refresh_token) NUNCA tocan el disco —
// viven exclusivamente en RAM y son invisibles para cualquier script XSS.
//
// Consecuencia esperada: al cerrar todas las pestañas o recargar la página
// el access_token se pierde. El AuthProvider reconstituye la sesión llamando
// a POST /api/v1/auth/refresh, que lee el refresh_token desde la cookie HttpOnly.

const _store = new Map<string, string>()

const inMemoryStorage: SupportedStorage = {
  getItem:    (key: string) => _store.get(key) ?? null,
  setItem:    (key: string, value: string) => { _store.set(key, value) },
  removeItem: (key: string) => { _store.delete(key) },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: inMemoryStorage,
    persistSession: false,   // No escribir en localStorage ni sessionStorage
    autoRefreshToken: false, // El refresco lo maneja el AuthProvider vía /refresh
    detectSessionInUrl: true, // Necesario para magic links y recovery de contraseña
  },
})
