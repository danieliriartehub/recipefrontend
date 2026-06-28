import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileShell } from "@/components/recipe/MobileShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Lock, Loader2, Eye, EyeOff, CheckCircle,
  ShieldCheck, AlertTriangle, Check, X,
} from "lucide-react";
import { backendApi } from "@/lib/backendApi";
import { useAuth } from "@/lib/auth";

// ─── Requisitos de contraseña (igual que en Auth.tsx) ──────────────────────────
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 20;
const DANGEROUS_CHARS_RE = /[<>'"`;\\]/g;

interface PasswordRule {
  id: string;
  label: string;
  test: (p: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { id: "length",  label: `Entre ${PASSWORD_MIN} y ${PASSWORD_MAX} caracteres`, test: (p) => p.length >= PASSWORD_MIN && p.length <= PASSWORD_MAX },
  { id: "upper",   label: "Al menos una mayúscula",                              test: (p) => /[A-Z]/.test(p) },
  { id: "lower",   label: "Al menos una minúscula",                              test: (p) => /[a-z]/.test(p) },
  { id: "number",  label: "Al menos un número",                                  test: (p) => /\d/.test(p) },
  { id: "special", label: "Al menos un carácter especial (!@#$%^&*...)",         test: (p) => /[!@#$%^&*()\-_=+\[\]{},.:?/|~]/.test(p) },
];

function isPasswordStrong(p: string) {
  return PASSWORD_RULES.every((r) => r.test(p));
}

const RuleItem = ({ met, label }: { met: boolean; label: string }) => (
  <li className={`flex items-center gap-2 text-xs transition-colors duration-200 ${met ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
    <span className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200 ${met ? "bg-green-500 text-white scale-110" : "bg-muted"}`}>
      {met ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5 opacity-50" />}
    </span>
    {label}
  </li>
);

// ─── Componente principal ──────────────────────────────────────────────────────
const ResetPassword = () => {
  const nav = useNavigate();
  const { recoveryToken, clearRecoveryToken, loading: authLoading } = useAuth();

  const [tokenError, setTokenError]   = useState(false);
  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [done, setDone]               = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // ── Detectar si hay token de recuperación disponible ─────────────────────
  // Supabase procesa el hash #access_token=...&type=recovery automáticamente
  // y lo expone via el evento PASSWORD_RECOVERY en el AuthProvider.
  // También intentamos leer el hash directamente como fallback (para casos edge).
  useEffect(() => {
    if (authLoading) return; // esperar a que el AuthProvider termine de inicializar

    // Verificar si hay un token de recuperación en el contexto (via PASSWORD_RECOVERY event)
    if (recoveryToken) return; // hay token disponible, mostrar el formulario

    // Fallback: intentar leer el hash de la URL directamente
    // (funciona si el componente carga antes de que Supabase consuma el hash)
    const hash = window.location.hash.substring(1);
    if (hash) {
      const params = new URLSearchParams(hash);
      const type = params.get("type");
      if (type === "recovery") return; // Supabase lo procesará pronto
    }

    // Si no hay token y el auth ya terminó de cargar, el link es inválido
    setTokenError(true);
  }, [recoveryToken, authLoading]);

  // ── Validaciones ────────────────────────────────────────────────────────────
  const cleanPassword = (v: string) =>
    v.replace(DANGEROUS_CHARS_RE, "").slice(0, PASSWORD_MAX);

  const allRulesMet    = isPasswordStrong(password);
  const passwordsMatch = password === confirm && confirm.length > 0;
  const canSubmit      = allRulesMet && passwordsMatch && !loading && !!recoveryToken;

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !recoveryToken) return;

    setLoading(true);
    try {
      await backendApi.post("/api/v1/auth/reset-password", {
        access_token: recoveryToken,
        new_password: password,
      });
      clearRecoveryToken();
      setDone(true);
      toast.success("✅ Contraseña actualizada", {
        description: "Ya puedes iniciar sesión con tu nueva contraseña.",
      });
    } catch (err: any) {
      const detail = err?.response?.data?.detail ?? err?.message ?? "Error desconocido";
      toast.error("No se pudo cambiar la contraseña", { description: detail });
    } finally {
      setLoading(false);
    }
  };

  // ── Pantalla de carga mientras el AuthProvider inicializa ───────────────────
  if (authLoading) {
    return (
      <MobileShell hideNav>
        <div className="flex min-h-screen flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Verificando link...</p>
        </div>
      </MobileShell>
    );
  }

  // ── Estado: éxito ────────────────────────────────────────────────────────────
  if (done) {
    return (
      <MobileShell hideNav>
        <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center gap-5">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-500/15">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold">¡Listo!</h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Tu contraseña ha sido actualizada correctamente.<br />
              Inicia sesión con tu nueva contraseña.
            </p>
          </div>
          <Button
            className="h-12 w-full rounded-2xl bg-gradient-primary text-base font-bold shadow-glow"
            onClick={() => nav("/auth", { replace: true })}
          >
            Ir a iniciar sesión
          </Button>
        </div>
      </MobileShell>
    );
  }

  // ── Estado: token inválido ────────────────────────────────────────────────────
  if (tokenError) {
    return (
      <MobileShell hideNav>
        <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center gap-5">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold">Link inválido</h1>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Este link de recuperación ya expiró o no es válido.<br />
              Solicita uno nuevo desde la pantalla de inicio de sesión.
            </p>
          </div>
          <Button
            variant="outline"
            className="h-12 w-full rounded-2xl"
            onClick={() => nav("/auth", { replace: true })}
          >
            Volver al inicio de sesión
          </Button>
        </div>
      </MobileShell>
    );
  }

  // ── Formulario ────────────────────────────────────────────────────────────────
  return (
    <MobileShell hideNav>
      <div className="flex min-h-screen flex-col px-6 pt-16">
        {/* Icono */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-4">
            <ShieldCheck className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-extrabold">Nueva contraseña</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Elige una contraseña segura para proteger tu cuenta RECIPE.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Nueva contraseña */}
          <div className="space-y-1.5">
            <Label htmlFor="new-pass">Nueva contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="new-pass"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                maxLength={PASSWORD_MAX}
                autoComplete="new-password"
                className={`h-12 rounded-xl pl-10 pr-10 ${
                  password.length > 0 && !allRulesMet
                    ? "border-destructive focus-visible:ring-destructive"
                    : allRulesMet
                    ? "border-green-500 focus-visible:ring-green-500"
                    : ""
                }`}
                value={password}
                onChange={(e) => setPassword(cleanPassword(e.target.value))}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Reglas de contraseña */}
            <div className={`overflow-hidden transition-all duration-300 ${(passwordFocused || password.length > 0) ? "max-h-64 opacity-100 mt-2" : "max-h-0 opacity-0"}`}>
              <div className="rounded-xl border border-border bg-muted/50 p-3">
                <ul className="space-y-1.5">
                  {PASSWORD_RULES.map((rule) => (
                    <RuleItem key={rule.id} met={rule.test(password)} label={rule.label} />
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmar contraseña */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm-pass">Confirmar contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirm-pass"
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                maxLength={PASSWORD_MAX}
                autoComplete="new-password"
                className={`h-12 rounded-xl pl-10 pr-10 ${
                  confirm.length > 0 && !passwordsMatch
                    ? "border-destructive focus-visible:ring-destructive"
                    : passwordsMatch
                    ? "border-green-500 focus-visible:ring-green-500"
                    : ""
                }`}
                value={confirm}
                onChange={(e) => setConfirm(cleanPassword(e.target.value))}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showConfirm ? "Ocultar" : "Mostrar"}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirm.length > 0 && !passwordsMatch && (
              <p className="pl-1 text-xs text-destructive">Las contraseñas no coinciden</p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="h-14 w-full rounded-2xl bg-gradient-primary text-base font-bold shadow-glow mt-2"
            disabled={!canSubmit}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Cambiar contraseña"
            )}
          </Button>
        </form>
      </div>
    </MobileShell>
  );
};

export default ResetPassword;
