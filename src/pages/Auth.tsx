import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, User as UserIcon, Loader2, CheckCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { backendApi } from "@/lib/backendApi";

// ─── Validaciones ─────────────────────────────────────────────────────────────
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// ─── Traducción de errores de Supabase ────────────────────────────────────────
function traducirError(msg: string): string {
  if (msg.includes("Invalid login credentials"))    return "Correo o contraseña incorrectos.";
  if (msg.includes("already registered"))           return "Este correo ya tiene una cuenta. Inicia sesión.";
  if (msg.includes("Email not confirmed"))          return "Confirma tu correo antes de ingresar.";
  if (msg.includes("Password should be at least")) return "La contraseña debe tener al menos 8 caracteres.";
  if (msg.includes("Unable to validate email"))    return "Ingresa un correo electrónico válido.";
  if (msg.includes("For security purposes"))       return "Espera unos segundos antes de intentar de nuevo.";
  return msg;
}

// ─── Componente ───────────────────────────────────────────────────────────────
const Auth = () => {
  const [mode, setMode]               = useState<"login" | "signup">("login");
  const [fullName, setFullName]       = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState<{ email?: string; password?: string; general?: string }>({});
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [countdown, setCountdown]     = useState(0);
  const [emailSent, setEmailSent]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotSent, setForgotSent]   = useState(false);

  const isNewUserRef = useRef(false);
  const { signIn, signUp, session } = useAuth();
  const nav = useNavigate();

  // Redirigir cuando aparezca sesión
  useEffect(() => {
    if (!session) return;
    nav("/app", { replace: true });
  }, [session, nav]);

  // Countdown de bloqueo (decrementa cada segundo, resetea contador al llegar a 0)
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setLoginAttempts(0);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // ── Validación en tiempo real ─────────────────────────────────────────────
  const handleEmailChange = (v: string) => {
    setEmail(v);
    if (v && !isValidEmail(v)) {
      setErrors((e) => ({ ...e, email: "Ingresa un correo válido" }));
    } else {
      setErrors((e) => ({ ...e, email: undefined }));
    }
  };

  const handlePasswordChange = (v: string) => {
    // Sanitización anti-inyección: elimina caracteres peligrosos antes de guardar
    const sanitized = v.replace(/[<>'"`;\\]/g, "");
    setPassword(sanitized);
    if (sanitized && sanitized.length < 8) {
      setErrors((e) => ({ ...e, password: "Mínimo 8 caracteres" }));
    } else {
      setErrors((e) => ({ ...e, password: undefined }));
    }
  };

  // ── Recuperar contraseña → backend /api/v1/auth/forgot-password ─────────
  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Ingresa tu correo primero");
      return;
    }
    try {
      await backendApi.post('/api/v1/auth/forgot-password', {
        email,
        redirect_to: window.location.origin + '/auth?mode=reset',
      });
      setForgotSent(true);
      toast.success("📧 Correo enviado", { description: "Revisa tu bandeja de entrada." });
    } catch (e: unknown) {
      toast.error("Error", { description: (e as Error).message });
    }
  };

  const isLocked = loginAttempts >= 5;

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || loading) return;
    setErrors((prev) => ({ ...prev, general: undefined }));
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          const next = loginAttempts + 1;
          setLoginAttempts(next);
          if (next >= 5) setCountdown(300);
          setErrors((e) => ({ ...e, general: traducirError(error) }));
        }
        // Éxito: el useEffect sobre `session` hace el redirect a /app
      } else {
        const { error, needsConfirmation } = await signUp(email, password, fullName);
        if (error) {
          setErrors((e) => ({ ...e, general: traducirError(error) }));
        } else {
          isNewUserRef.current = true;
          if (needsConfirmation) {
            // Supabase requiere confirmar correo → mostramos pantalla de aviso
            setEmailSent(true);
          }
          // Si auto-confirmado → onAuthStateChange dispara → session cambia → redirect a /app
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Pantalla "revisa tu correo" ───────────────────────────────────────────
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
            onClick={() => { setEmailSent(false); setMode("login"); }}
          >
            Ya confirmé, ingresar
          </Button>
        </div>
      </MobileShell>
    );
  }

  // Botón deshabilitado si: cargando, bloqueado, hay errores de validación o campos vacíos
  const submitDisabled =
    loading ||
    isLocked ||
    !!errors.email ||
    !!errors.password ||
    !email ||
    !password ||
    (mode === "signup" && !fullName.trim());

  // ── Formulario principal ──────────────────────────────────────────────────
  return (
    <MobileShell hideNav>
      <ScreenHeader
        title={mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}
        subtitle="Únete a la comunidad RECIPE"
      />

      <div className="px-5 pt-2">
        {/* Botón volver manual — nav(-1) no funciona si no hay historial previo */}
        <button
          onClick={() => nav("/", { replace: false })}
          className="mb-4 flex items-center gap-2 rounded-full bg-muted px-3 py-2 text-sm font-semibold transition-smooth hover:bg-muted/70"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </button>
        {/* Toggle login / signup */}
        <div className="mb-5 grid grid-cols-2 rounded-2xl bg-muted p-1">
          {(["login", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setMode(t); setErrors({}); }}
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

        {/* Banner de bloqueo por intentos */}
        {isLocked && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            🔒 Demasiados intentos. Espera {countdown}s antes de intentar de nuevo.
          </div>
        )}

        {/* Banner error general (solo si no está bloqueado) */}
        {!isLocked && errors.general && (
          <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errors.general}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Nombre completo</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="fullName"
                  required
                  placeholder="Camila Rojas"
                  className="h-12 rounded-xl pl-10"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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
                type="text"
                placeholder="tu.correo@universidad.edu.pe"
                className={`h-12 rounded-xl pl-10 ${
                  errors.email ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
              />
            </div>
            {errors.email && (
              <p className="pl-1 text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pass">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="pass"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                maxLength={72}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className={`h-12 rounded-xl pl-10 pr-10 ${
                  errors.password ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="pl-1 text-xs text-destructive">{errors.password}</p>
            )}
            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
                {forgotSent && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Correo enviado a {email}
                  </p>
                )}
              </div>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="h-14 w-full rounded-2xl bg-gradient-primary text-base font-bold shadow-glow"
            disabled={submitDisabled}
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

        {/* Botón Google — próximamente */}
        <button
          type="button"
          onClick={() => toast.info("Próximamente 🚀")}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-border bg-background text-sm font-semibold transition-smooth hover:bg-muted"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </button>

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
