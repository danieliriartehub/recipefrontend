import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Welcome from "./Welcome";

/**
 * Ruta raíz "/".
 * - Si el usuario ya tiene sesión activa → lo lleva directo al Dashboard.
 * - Si no → muestra la pantalla de bienvenida (Welcome).
 */
const Index = () => {
  const { session, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && session) {
      nav("/app", { replace: true });
    }
  }, [session, loading, nav]);

  // Mientras resuelve la sesión, no renderiza nada (el spinner lo maneja AuthProvider)
  if (loading) return null;

  return <Welcome />;
};

export default Index;
