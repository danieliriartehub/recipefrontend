import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Mail, Lock, User as UserIcon, Loader2, CheckCircle,
  ArrowLeft, Eye, EyeOff, Check, X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { backendApi } from "@/lib/backendApi";

// ─── Sanitización anti-inyección ─────────────────────────────────────────────
/**
 * Elimina caracteres usados en SQL injection y XSS.
 * El backend (Supabase) usa prepared statements, pero esta capa de defensa
 * en profundidad impide que datos maliciosos lleguen siquiera al wire.
 */
const DANGEROUS_CHARS_RE = /[<>'";`\\]/g;

function sanitizeText(v: string): string {
  return v.replace(DANGEROUS_CHARS_RE, "");
}

function sanitizeEmail(v: string): string {
  // Correo: solo letras, números y caracteres propios del formato email
  return v.replace(/[^a-zA-Z0-9@.\-_+]/g, "").slice(0, 254);
}

// ─── Validación de email ──────────────────────────────────────────────────────
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// ─── Requisitos de contraseña ─────────────────────────────────────────────────
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 20;

interface PasswordRule {
  id: string;
  label: string;
  test: (p: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { id: "length",   label: `Entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres`, test: (p) => p.length >= PASSWORD_MIN && p.length <= PASSWORD_MAX },
  { id: "upper",    label: "Al menos una mayúscula",                              test: (p) => /[A-Z]/.test(p) },
  { id: "lower",    label: "Al menos una minúscula",                              test: (p) => /[a-z]/.test(p) },
  { id: "number",   label: "Al menos un número",                                  test: (p) => /\d/.test(p) },
  { id: "special",  label: "Al menos un carácter especial (!@#$%^&*...)",         test: (p) => /[!@#$%^&*()\-_=+\[\]{},.:?/|~]/.test(p) },
];

function isPasswordStrong(p: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(p));
}

// ─── Traducción de errores ────────────────────────────────────────────────────
function traducirError(msg: string): string {
  if (msg.includes("Invalid login credentials"))    return "Correo o contraseña incorrectos.";
  if (msg.includes("already registered"))           return "Este correo ya tiene una cuenta. Inicia sesión.";
  if (msg.includes("Email not confirmed"))          return "Confirma tu correo antes de ingresar.";
  if (msg.includes("Password should be at least")) return "La contraseña debe tener al menos 8 caracteres.";
  if (msg.includes("Unable to validate email"))    return "Ingresa un correo electrónico válido.";
  if (msg.includes("For security purposes"))       return "Espera unos segundos antes de intentar de nuevo.";
  return msg;
}

// ─── Subcomponente: indicador de requisito ────────────────────────────────────
const RuleItem = ({ met, label }: { met: boolean; label: string }) => (
  <li className={`flex items-center gap-2 text-xs transition-colors duration-200 ${met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
    <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200 ${met ? "bg-green-500 text-white scale-110" : "bg-muted"}`}>
      {met ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5 opacity-50" />}
    </span>
    {label}
  </li>
);

// ─── Barra de fuerza de contraseña ───────────────────────────────────────────
const StrengthBar = ({ password }: { password: string }) => {
  const metCount = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const pct = password.length === 0 ? 0 : Math.round((metCount / PASSWORD_RULES.length) * 100);

  const color =
    pct < 40 ? "bg-red-500" :
    pct < 80 ? "bg-yellow-500" :
               "bg-green-500";

  const label =
    password.length === 0 ? "" :
    pct < 40  ? "Débil" :
    pct < 80  ? "Moderada" :
                "Fuerte";

  return (
    <div className="mt-2 space-y-1">
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Fuerza</span>
        <span className={`font-semibold ${pct >= 80 ? "text-green-600 dark:text-green-400" : pct >= 40 ? "text-yellow-600" : "text-red-500"}`}>
          {label}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ─── Componente principal ─────────────────────────────────────────────────────
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
  const [passwordFocused, setPasswordFocused] = useState(false);

  const isNewUserRef  = useRef(false);
  const submittingRef = useRef(false);

  const { signIn, signUp, session } = useAuth();
  const nav = useNavigate();

  // Redirigir cuando aparezca sesión
  useEffect(() => {
    if (!session) return;
    nav("/app", { replace: true });
  }, [session, nav]);

  // Countdown de bloqueo
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { setLoginAttempts(0); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // ── Handlers con sanitización ─────────────────────────────────────────────

  const handleFullNameChange = (v: string) => {
    // Nombre: sin caracteres peligrosos, max 80 chars
    setFullName(sanitizeText(v).slice(0, 80));
  };

  const handleEmailChange = (v: string) => {
    const clean = sanitizeEmail(v);
    setEmail(clean);
    if (clean && !isValidEmail(clean)) {
      setErrors((e) => ({ ...e, email: "Ingresa un correo válido" }));
    } else {
      setErrors((e) => ({ ...e, email: undefined }));
    }
  };

  const handlePasswordChange = useCallback((v: string) => {
    // Límite hard de 20 caracteres, sin caracteres de escape SQL/XSS
    const cleaned = v.replace(DANGEROUS_CHARS_RE, "").slice(0, PASSWORD_MAX);
    setPassword(cleaned);

    if (mode === "login") {
      // En login solo validamos que no esté vacío
      setErrors((e) => ({ ...e, password: undefined }));
    } else {
      // En signup validamos todos los requisitos
      if (cleaned.length > 0 && !isPasswordStrong(cleaned)) {
        setErrors((e) => ({ ...e, password: "La contraseña no cumple los requisitos" }));
      } else {
        setErrors((e) => ({ ...e, password: undefined }));
      }
    }
  }, [mode]);

  // ── Recuperar contraseña ──────────────────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!email) { toast.error("Ingresa tu correo primero"); return; }
    try {
      await backendApi.post("/api/v1/auth/forgot-password", {
        email: sanitizeEmail(email),
        redirect_to: window.location.origin + "/auth?mode=reset",
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
    if (isLocked || submittingRef.current) return;

    // Validación final antes de enviar
    if (!isValidEmail(email)) {
      setErrors((e) => ({ ...e, email: "Ingresa un correo válido" }));
      return;
    }
    if (mode === "signup" && !isPasswordStrong(password)) {
      setErrors((e) => ({ ...e, password: "La contraseña no cumple los requisitos" }));
      return;
    }

    submittingRef.current = true;
    setErrors((prev) => ({ ...prev, general: undefined }));
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await signIn(email.trim(), password);
        if (error) {
          const next = loginAttempts + 1;
          setLoginAttempts(next);
          if (next >= 5) setCountdown(300);
          setErrors((e) => ({ ...e, general: traducirError(error) }));
        }
      } else {
        const { error, needsConfirmation } = await signUp(
          email.trim(),
          password,
          sanitizeText(fullName).trim()
        );
        if (error) {
          setErrors((e) => ({ ...e, general: traducirError(error) }));
        } else {
          isNewUserRef.current = true;
          if (needsConfirmation) setEmailSent(true);
        }
      }
    } finally {
      setLoading(false);
      submittingRef.current = false;
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

  const passwordRulesVisible = mode === "signup" && (passwordFocused || password.length > 0);
  const allRulesMet = isPasswordStrong(password);

  const submitDisabled =
    loading ||
    isLocked ||
    !!errors.email ||
    !email ||
    !password ||
    (mode === "signup" && (!fullName.trim() || !allRulesMet));

  // ── Formulario principal ──────────────────────────────────────────────────
  return (
    <MobileShell hideNav>
      <ScreenHeader
        title={mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}
        subtitle="Únete a la comunidad RECIPE"
      />

      <div className="px-5 pt-2">
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
              onClick={() => { setMode(t); setErrors({}); setPassword(""); setPasswordFocused(false); }}
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

        {/* Banner de bloqueo */}
        {isLocked && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            🔒 Demasiados intentos. Espera {countdown}s antes de intentar de nuevo.
          </div>
        )}

        {/* Banner error general */}
        {!isLocked && errors.general && (
          <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errors.general}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>

          {/* Nombre completo (solo signup) */}
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
                  maxLength={80}
                  autoComplete="name"
                  onChange={(e) => handleFullNameChange(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo universitario</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="text"
                inputMode="email"
                placeholder="tu.correo@universidad.edu.pe"
                className={`h-12 rounded-xl pl-10 ${
                  errors.email ? "border-destructive focus-visible:ring-destructive" : ""
                }`}
                value={email}
                autoComplete={mode === "login" ? "username" : "email"}
                maxLength={254}
                onChange={(e) => handleEmailChange(e.target.value)}
              />
            </div>
            {errors.email && (
              <p className="pl-1 text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Contraseña */}
          <div className="space-y-1.5">
            <Label htmlFor="pass">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="pass"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                maxLength={PASSWORD_MAX}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className={`h-12 rounded-xl pl-10 pr-10 ${
                  errors.password && password.length > 0
                    ? "border-destructive focus-visible:ring-destructive"
                    : allRulesMet && mode === "signup"
                    ? "border-green-500 focus-visible:ring-green-500"
                    : ""
                }`}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
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



            {/* Barra de fuerza + reglas (solo signup) */}
            {mode === "signup" && (
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  passwordRulesVisible ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="mt-1 rounded-xl border border-border bg-muted/50 p-3">
                  <StrengthBar password={password} />
                  <ul className="mt-3 space-y-1.5">
                    {PASSWORD_RULES.map((rule) => (
                      <RuleItem key={rule.id} met={rule.test(password)} label={rule.label} />
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Link olvidé contraseña (solo login) */}
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
