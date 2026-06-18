import { useNavigate } from "react-router-dom";
import { MobileShell } from "@/components/recipe/MobileShell";
import { useAuth } from "@/lib/auth";
import { createPaymentSession } from "@/lib/api";
import {
  Crown, Check, ArrowLeft, Sparkles, Shield, Zap, Star,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import KRGlue from "@lyracom/embedded-form-glue";
import { toast } from "sonner";

// ─── Clave pública de IziPay (micuentaweb.pe) ────────────────────────────────
const IZIPAY_PUBLIC_KEY = "61792228:publickey_sRnFfkR0pTYa9JQGe0dcS9g5zzwIChGYdSN0us0o1RoH2";
const IZIPAY_DOMAIN = "https://static.micuentaweb.pe";

// ─── Beneficios RECIPE Plus ───────────────────────────────────────────────────
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
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formToken, setFormToken] = useState<string | null>(null);
  const isSDKLoaded = useRef(false);

  // Cargar SDK de IziPay cuando haya un token disponible
  useEffect(() => {
    if (formToken && !isSDKLoaded.current) {
      isSDKLoaded.current = true;

      KRGlue.loadLibrary(IZIPAY_DOMAIN, IZIPAY_PUBLIC_KEY)
        .then(({ KR }) =>
          KR.setFormConfig({
            formToken: formToken,
            "kr-language": "es-ES",
          })
        )
        .then(({ KR }) => KR.onSubmit(onPaymentComplete))
        // Al usar un div estático con clase kr-embedded, no llamamos a addForm
        .then(({ KR }) => KR.showForm("myPaymentForm"))
        .then(() => {
          setLoading(false);
          // Disparamos el botón generado por IziPay para abrir el modal
          setTimeout(() => {
            const btn = document.querySelector(".kr-popin-button") as HTMLButtonElement;
            if (btn) btn.click();
          }, 300);
        })
        .catch((error) => {
          console.error("IziPay SDK load error", error);
          toast.error("Error al cargar la pasarela de pagos flotante");
          setLoading(false);
          setFormToken(null);
          isSDKLoaded.current = false;
        });
    }
  }, [formToken]);

  // Callback cuando se completa la transacción en el pop-in
  const onPaymentComplete = async (paymentData: any) => {
    if (paymentData.clientAnswer.orderStatus === "PAID") {
      toast.success("¡Pago exitoso! Bienvenido a RECIPE Plus 👑");
      await refreshProfile();
      setTimeout(() => navigate("/app/profile"), 1500);
    } else {
      toast.error("El pago no se pudo procesar. Intenta nuevamente.");
      setFormToken(null);
      isSDKLoaded.current = false;
    }
    return false; 
  };

  const handleSubscribe = async () => {
    if (formToken) {
      // Si ya tenemos el token cargado y cerraron el modal, solo lo reabrimos
      const btn = document.querySelector(".kr-popin-button") as HTMLButtonElement;
      if (btn) btn.click();
      return;
    }

    try {
      setLoading(true);
      // Llama a nuestro backend para obtener el token
      const res = await createPaymentSession();
      if (res && res.formToken) {
        setFormToken(res.formToken);
      } else {
        throw new Error("No form token returned");
      }
    } catch (err) {
      console.error(err);
      toast.error("No se pudo iniciar el pago. Intenta más tarde.");
      setLoading(false);
    }
  };

  return (
    <MobileShell>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 px-5 pb-10 pt-[max(env(safe-area-inset-top),20px)] text-white">
        {/* Decoración */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-white/10 blur-xl" />

        {/* Botón volver */}
        <button
          onClick={() => navigate(-1)}
          className="relative mb-5 flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al perfil
        </button>

        {/* Ícono + título */}
        <div className="relative flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 shadow-xl backdrop-blur ring-4 ring-white/30">
            <Crown className="h-10 w-10 text-white" />
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            RECIPE Plus
          </h1>
          <p className="mt-1.5 text-sm text-yellow-50/90">
            La experiencia premium de reciclaje universitario
          </p>

          {/* Badge precio */}
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
            <div
              key={title}
              className="flex items-start gap-4 rounded-2xl bg-card p-4 shadow-soft"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="font-display text-sm font-bold">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {desc}
                </p>
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
            <p className="text-sm font-bold text-amber-800">
              Sin compromiso de permanencia
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              Cancela cuando quieras. Tu suscripción se mantiene activa hasta
              el final del período pagado.
            </p>
          </div>
        </div>
      </section>

      {/* ── Ocultar el botón nativo de IziPay para usar el nuestro ── */}
      <style>{`
        .kr-popin-button {
          display: none !important;
        }
      `}</style>

      {/* ── Contenedor IziPay (Pop-In) ────────────────────────────────────── */}
      <div id="myPaymentForm" className="kr-embedded" kr-popin="kr-popin"></div>

      {/* ── CTA Principal ──────────────────────────────────────────────────── */}
      <section className="px-5 py-6">
        <Button
          id="btn-subscribe-recipe-plus"
          onClick={handleSubscribe}
          disabled={loading}
          className="h-14 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-base font-bold text-white shadow-lg transition-all hover:from-amber-600 hover:to-yellow-600 hover:shadow-xl disabled:opacity-80"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Iniciando pasarela segura...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Suscribirme por S/ 5.99 / mes
            </span>
          )}
        </Button>

        {/* Indicador pago seguro */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <Shield className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-center text-[11px] text-muted-foreground">
            Pago seguro procesado por{" "}
            <span className="font-semibold text-[#00A09D]">IziPay</span>
          </p>
        </div>

        {/* Métodos de pago aceptados */}
        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Acepta Visa · Mastercard · Amex · Yape · QR
        </p>
      </section>
    </MobileShell>
  );
};

export default RecipePlus;
