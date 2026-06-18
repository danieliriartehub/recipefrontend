import { useNavigate } from "react-router-dom";
import { MobileShell } from "@/components/recipe/MobileShell";
import { useAuth } from "@/lib/auth";
import { createPaymentSession } from "@/lib/api";
import {
  Crown, Check, ArrowLeft, Sparkles, Shield, Zap, Star, X, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";

// KR es el objeto global que inyecta kr-payment-form.min.js desde index.html
declare const KR: any;

const BENEFITS = [
  {
    icon: Shield,
    title: "Sin anuncios",
    desc: "Navega por toda la app sin ninguna interrupción publicitaria.",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    icon: Crown,
    title: "Badge exclusivo",
    desc: "Muestra tu insignia PLUS en tu perfil y destaca en la comunidad.",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    icon: Zap,
    title: "Acceso anticipado",
    desc: "Sé el primero en probar nuevas funciones antes que nadie.",
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    icon: Star,
    title: "Apoya la misión",
    desc: "Tu suscripción financia la expansión de centros de reciclaje en campus.",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
];

const RecipePlus = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  const [loading, setLoading]         = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formToken, setFormToken]     = useState<string | null>(null);
  const [krReady, setKrReady]         = useState(false);

  const formTokenRef = useRef<string | null>(null);

  // ── Registrar el callback de KR.onSubmit una sola vez cuando KR está listo ──
  // KR se inyecta globalmente desde index.html — esperamos a que exista
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 20; // 2 segundos máximo

    const waitForKR = setInterval(() => {
      attempts++;
      if (typeof KR !== "undefined" && KR?.onSubmit) {
        clearInterval(waitForKR);

        KR.onSubmit(async (paymentData: any) => {
          const status = paymentData?.clientAnswer?.orderStatus;
          if (status === "PAID") {
            toast.success("¡Pago exitoso! Bienvenido a RECIPE Plus 👑");
            setIsModalOpen(false);
            await refreshProfile();
            setTimeout(() => navigate("/app/profile"), 1200);
          } else {
            toast.error("El pago no se pudo procesar. Intenta nuevamente.");
          }
          return false; // prevenir redirect automático
        });

        setKrReady(true);
      } else if (attempts >= maxAttempts) {
        clearInterval(waitForKR);
        console.error("[IziPay] KR global no disponible tras esperar 2s");
      }
    }, 100);

    return () => clearInterval(waitForKR);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // ── Obtener formToken del backend y abrir modal ───────────────────────────
  const handleSubscribe = async () => {
    if (isModalOpen) return;

    // Reusar token si ya existe (evita crear sesión nueva)
    if (!formTokenRef.current) {
      try {
        setLoading(true);
        const res = await createPaymentSession();
        if (!res?.formToken) throw new Error("Sin formToken");
        formTokenRef.current = res.formToken;
        setFormToken(res.formToken);
      } catch {
        toast.error("No se pudo iniciar el pago. Intenta más tarde.");
        return;
      } finally {
        setLoading(false);
      }
    }

    setIsModalOpen(true);
  };

  return (
    <MobileShell>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 px-5 pb-10 pt-[max(env(safe-area-inset-top),20px)] text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-white/10 blur-xl" />
        <button
          onClick={() => navigate(-1)}
          className="relative mb-5 flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al perfil
        </button>
        <div className="relative flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 shadow-xl backdrop-blur ring-4 ring-white/30">
            <Crown className="h-10 w-10 text-white" />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">RECIPE Plus</h1>
          <p className="mt-1.5 text-sm text-yellow-50/90">La experiencia premium de reciclaje universitario</p>
          <div className="mt-4 flex items-baseline gap-1 rounded-2xl bg-white/20 px-5 py-2 backdrop-blur">
            <span className="font-display text-3xl font-extrabold">S/ 5.99</span>
            <span className="text-sm font-medium text-yellow-50/80">/ mes</span>
          </div>
        </div>
      </header>

      {/* ── Beneficios ─────────────────────────────────────────────────────── */}
      <section className="px-5 pt-6">
        <p className="mb-4 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Qué incluye tu membresía
        </p>
        <div className="space-y-3">
          {BENEFITS.map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className="flex items-start gap-4 rounded-2xl bg-card p-4 shadow-soft">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="font-display text-sm font-bold">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
              </div>
              <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-500" />
            </div>
          ))}
        </div>
      </section>

      {/* ── Garantía ───────────────────────────────────────────────────────── */}
      <section className="mx-5 mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-bold text-amber-800">Sin compromiso de permanencia</p>
            <p className="mt-0.5 text-xs text-amber-700">
              Cancela cuando quieras. Tu suscripción se mantiene activa hasta el final del período pagado.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="px-5 py-6">
        <Button
          onClick={handleSubscribe}
          disabled={loading}
          className="h-14 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-base font-bold text-white shadow-lg hover:from-amber-600 hover:to-yellow-600 disabled:opacity-80"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Iniciando pasarela segura...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Suscribirme por S/ 5.99 / mes
            </span>
          )}
        </Button>
        <div className="mt-3 flex items-center justify-center gap-2">
          <Shield className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-center text-[11px] text-muted-foreground">
            Pago seguro procesado por{" "}
            <span className="font-semibold text-[#00A09D]">IziPay</span>
          </p>
        </div>
      </section>

      {/*
        ── Modal de pago ─────────────────────────────────────────────────────
        Siempre montado en el DOM — visibilidad controlada por CSS.
        El div.kr-smart-form con kr-form-token es detectado automáticamente
        por el SDK global (kr-payment-form.min.js) cuando el atributo cambia.
      */}
      <div
        role="dialog"
        aria-modal="true"
        aria-hidden={!isModalOpen}
        className={[
          "fixed inset-0 z-[100] flex items-end justify-center sm:items-center",
          "bg-black/60 backdrop-blur-sm transition-opacity duration-200",
          isModalOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <div
          className={[
            "relative w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl",
            "max-h-[90dvh] flex flex-col transition-transform duration-200",
            isModalOpen ? "translate-y-0" : "translate-y-full sm:translate-y-4",
          ].join(" ")}
        >
          {/* Cabecera */}
          <div className="flex items-center justify-between border-b px-5 py-4 shrink-0">
            <div>
              <h2 className="font-display text-base font-bold">Completar Pago</h2>
              <p className="text-xs text-muted-foreground">Estás a un paso de ser PLUS 👑</p>
            </div>
            <button
              onClick={closeModal}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Cuerpo */}
          <div className="flex-1 overflow-y-auto px-4 py-5">
            {/* Spinner mientras no hay token o KR no está listo */}
            {(!formToken || !krReady) && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                <p className="text-sm text-muted-foreground">Cargando pasarela de pago...</p>
              </div>
            )}

            {/*
              Formulario IziPay según documentación oficial:
              - class="kr-smart-form" → SDK detecta y renderiza el formulario
              - kr-form-token → el token generado por el backend
              - kr-card-form-expanded → muestra el form de tarjeta expandido por defecto
              El SDK de IziPay (cargado en index.html) escanea el DOM y
              renderiza el formulario cuando encuentra este div.
            */}
            {formToken && krReady && (
              <div
                className="kr-smart-form"
                kr-form-token={formToken}
                kr-card-form-expanded="true"
              />
            )}
          </div>

          {/* Pie */}
          <div className="shrink-0 bg-gray-50 px-5 py-3 rounded-b-3xl flex items-center justify-center gap-2 border-t">
            <Shield className="h-3.5 w-3.5 text-[#00A09D]" />
            <p className="text-xs text-gray-500 font-medium">
              Pagos 100% seguros · Tarjeta · Yape · Plin
            </p>
          </div>
        </div>
      </div>
    </MobileShell>
  );
};

export default RecipePlus;
