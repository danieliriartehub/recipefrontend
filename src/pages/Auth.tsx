import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, User as UserIcon, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";

// ─── Traducción de errores comunes de Supabase ───────────────────────────────
function traducirError(msg: string): string {
  if (msg.includes("Invalid login credentials"))    return "Correo o contraseña incorrectos.";
  if (msg.includes("Email not confirmed"))          return "Confirma tu correo antes de ingresar.";
  if (msg.includes("User already registered"))      return "Este correo ya está registrado. Intenta ingresar.";
  if (msg.includes("Password should be at least"))  return "La contraseña debe tener al menos 6 caracteres.";
  if (msg.includes("Unable to validate email"))     return "Ingresa un correo electrónico válido.";
  if (msg.includes("For security purposes"))        return "Espera unos segundos antes de intentar de nuevo.";
  return msg;
}

// ─── Componente ───────────────────────────────────────────────────────────────

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  // Nos dice si el último flujo fue un registro (para redirigir a onboarding)
  const isNewUserRef = useRef(false);

  const { signIn, signUp, session } = useAuth();
  const nav = useNavigate();

  // Redirigir automáticamente cuando aparezca la sesión
  useEffect(() => {
    if (!session) return;
    if (isNewUserRef.current) {
      nav("/onboarding", { replace: true });
    } else {
      nav("/app", { replace: true });
    }
  }, [session, nav]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          setError(traducirError(error));
        } else {
          toast.success("¡Bienvenida de vuelta! 🌱");
          // El useEffect de arriba se encarga del redirect cuando session cambia
        }
      } else {
        const { error } = await signUp(email, password, name);
        if (error) {
          setError(traducirError(error));
        } else {
          isNewUserRef.current = true;
          // Si Supabase requiere confirmación de correo, session seguirá null
          // → mostramos pantalla "revisa tu correo".
          // Si email-confirm está desactivado, session ya cambió y el useEffect redirige.
          if (!session) setEmailSent(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Pantalla "revisa tu correo" ──────────────────────────────────────────
  if (emailSent) {
    return (
      <MobileShell hideNav>
        <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mt-5 font-display text-2xl font-extrabold">¡Revisa tu correo!</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Enviamos un enlace de confirmación a{" "}
            <span className="font-semibold text-foreground">{email}</span>.{" "}
            Haz clic en ese enlace para activar tu cuenta y empezar a reciclar.
          </p>
          <Button
            variant="outline"
            className="mt-8 h-12 w-full rounded-2xl"
            onClick={() => {
              setEmailSent(false);
              setMode("login");
            }}
          >
            Ya confirmé, ingresar
          </Button>
        </div>
      </MobileShell>
    );
  }

  // ─── Formulario principal ─────────────────────────────────────────────────
  return (
    <MobileShell hideNav>
      <ScreenHeader
        title={mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}
        subtitle="Únete a la comunidad RECIPE"
        back
      />

      <div className="px-5 pt-2">
        {/* Toggle login / signup */}
        <div className="mb-5 grid grid-cols-2 rounded-2xl bg-muted p-1">
          {(["login", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setMode(t); setError(null); }}
              className={`rounded-xl py-2.5 text-sm font-semibold transition-smooth ${
                mode === t
                  ? "bg-background shadow-soft text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {t === "login" ? "Ingresar" : "Registrarme"}
            </button>
          ))}
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre completo</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  required
                  placeholder="Camila Rojas"
                  className="h-12 rounded-xl pl-10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Correo universitario</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                placeholder="tu.correo@universidad.edu.pe"
                className="h-12 rounded-xl pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pass">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="pass"
                type="password"
                required
                placeholder="••••••••"
                className="h-12 rounded-xl pl-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="h-14 w-full rounded-2xl bg-gradient-primary text-base font-bold shadow-glow"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : mode === "login" ? (
              "Ingresar a RECIPE"
            ) : (
              "Crear mi cuenta"
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Al continuar aceptas nuestros{" "}
          <Link to="#" className="font-medium text-primary">Términos</Link> y{" "}
          <Link to="#" className="font-medium text-primary">Privacidad</Link>.
        </p>
      </div>
    </MobileShell>
  );
};

export default Auth;
