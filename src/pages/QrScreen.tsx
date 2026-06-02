import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { useAuth } from "@/lib/auth";
import { generateQrToken } from "@/lib/api";
import { Download, RefreshCw, Share2, ShieldCheck, Wallet as WalletIcon } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabase";

const QrScreen = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [qrDataUrl, setQrDataUrl]   = useState<string>("");
  const [token, setToken]           = useState<string>("");
  const [expiresAt, setExpiresAt]   = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [deliveryReceived, setDeliveryReceived] = useState(false);
  const [deliveryPoints, setDeliveryPoints]     = useState(0);

  // Redirige si no hay sesión
  useEffect(() => {
    if (!user && !loading) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  // ── Genera un QR nuevo desde Supabase y lo convierte a imagen ────────────
  const refreshQr = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateQrToken(user.id);
      setToken(result.token);
      setExpiresAt(new Date(result.expires_at));
      setSecondsLeft(60);

      const url = await QRCode.toDataURL(result.token, {
        width: 280,
        margin: 2,
        color: { dark: "#111827", light: "#ffffff" },
      });
      setQrDataUrl(url);
    } catch {
      setError("No se pudo generar el QR. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // QR inicial al montar
  useEffect(() => { refreshQr(); }, [refreshQr]);

  // Countdown y auto-renovación
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const diff = Math.max(
        0,
        Math.round((expiresAt.getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(diff);
      if (diff === 0) refreshQr();
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, refreshQr]);

  // ── Guardar QR como imagen ────────────────────────────────────────────────
  const handleSaveImage = async () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `QR-RECIPE-${profile?.qr_code ?? user?.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR guardado en tu dispositivo");
  };

  // ── Compartir QR (Web Share API con archivo, o copia el token) ─────────
  const handleShareQr = async () => {
    if (!qrDataUrl) return;
    try {
      const res  = await fetch(qrDataUrl);
      const blob = await res.blob();
      const file = new File(
        [blob],
        `QR-RECIPE-${profile?.qr_code}.png`,
        { type: "image/png" }
      );
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Mi QR RECIPE",
          text:  `Mi código QR personal de reciclaje USIL - ${profile?.full_name}`,
          files: [file],
        });
      } else {
        await navigator.clipboard.writeText(token);
        toast.success("Código copiado al portapapeles");
      }
    } catch {
      toast.error("No se pudo compartir el QR");
    }
  };

  // Suscripción Realtime — detecta cuando el validador registra la entrega
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`qr_delivery:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'recyclings',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setDeliveryReceived(true)
          setDeliveryPoints((payload.new as any).points_earned ?? 0)
          // Después de 4s oculta el overlay y genera un QR nuevo
          setTimeout(() => {
            setDeliveryReceived(false)
            refreshQr()
          }, 4000)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id, refreshQr])

  const fullName = profile?.full_name ?? "Usuario";
  const qrCode   = profile?.qr_code   ?? `RECIPE-${user?.id?.slice(0, 8) ?? ""}`;
  const points   = profile?.points    ?? 0;

  return (
    <MobileShell>
      <ScreenHeader title="Mi código QR" subtitle="Validación instantánea con recompensa" back />

      <div className="px-5">
        {/* ── Card con borde degradado (diseño original) ── */}
        <div className="rounded-[28px] bg-gradient-hero p-1 shadow-float">
          <div className="rounded-[24px] bg-card p-6">

            {/* Encabezado del usuario */}
            <div className="text-center space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                RECIPE · QR personal
              </p>
              <h2 className="font-display text-2xl font-extrabold">{fullName}</h2>
              <p className="inline-block rounded-lg bg-muted px-3 py-1 font-mono text-xs text-muted-foreground">
                {qrCode}
              </p>
              <p className="text-xs text-muted-foreground">
                {points.toLocaleString()} EcoPuntos
              </p>
            </div>

            {/* ── QR image — responsive para pantallas desde 320px ── */}
            <div className="relative mx-auto mt-5 flex items-center justify-center">
              {/* Overlay de confirmación cuando el validador registra la entrega */}
              {deliveryReceived && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl bg-primary/95 p-6 text-center text-white">
                  <p className="text-5xl mb-3">🎉</p>
                  <p className="text-xl font-extrabold">¡Entrega registrada!</p>
                  <p className="mt-2 text-3xl font-extrabold">+{deliveryPoints}</p>
                  <p className="text-sm opacity-80">EcoPuntos acreditados</p>
                  <p className="mt-3 text-xs opacity-60">Generando nuevo QR...</p>
                </div>
              )}
              {loading ? (
                <div className="h-[min(280px,calc(100vw-80px))] w-[min(280px,calc(100vw-80px))] animate-pulse rounded-3xl bg-muted" />
              ) : error ? (
                <div className="flex h-[min(280px,calc(100vw-80px))] w-[min(280px,calc(100vw-80px))] flex-col items-center justify-center rounded-3xl bg-destructive/10 p-6 text-center">
                  <p className="text-sm text-destructive">{error}</p>
                  <button
                    onClick={refreshQr}
                    className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white"
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <img
                  src={qrDataUrl}
                  alt="Código QR personal RECIPE"
                  className="h-[min(280px,calc(100vw-80px))] w-[min(280px,calc(100vw-80px))] rounded-3xl shadow-card"
                />
              )}
            </div>

            {/* ── Countdown bar ── */}
            <div className="mt-4 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    secondsLeft > 20
                      ? "bg-primary"
                      : secondsLeft > 10
                      ? "bg-accent"
                      : "bg-destructive"
                  }`}
                  style={{ width: `${(secondsLeft / 60) * 100}%` }}
                />
              </div>
              <span
                className={`text-xs font-bold tabular-nums ${
                  secondsLeft <= 10 ? "text-destructive" : "text-muted-foreground"
                }`}
              >
                {secondsLeft}s
              </span>
            </div>
            <p className="mt-1 text-center text-[11px] text-muted-foreground">
              Se renueva automáticamente · único por entrega
            </p>

            {/* Badge verificado */}
            <div className="mt-3 flex items-center justify-center gap-2 rounded-full bg-success/10 py-2 text-success">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-bold">Código verificado · USIL</span>
            </div>

            {/* Token truncado */}
            <div className="mt-3 overflow-hidden rounded-2xl bg-muted/60 px-3 py-2 text-center font-mono text-sm tracking-wider">
              {loading ? "···" : `${token.slice(0, 24)}···`}
            </div>

            {/* Botones: Guardar + Compartir + Renovar */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleSaveImage}
                disabled={loading || !!error}
                className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold text-primary disabled:opacity-40"
              >
                <Download className="h-3.5 w-3.5" /> Guardar QR
              </button>
              <button
                onClick={handleShareQr}
                disabled={loading || !!error}
                className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                <Share2 className="h-3.5 w-3.5" /> Compartir
              </button>
              <button
                onClick={refreshQr}
                disabled={loading}
                className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Renovar
              </button>
            </div>
          </div>
        </div>

        {/* Acceso directo a Eco Wallet */}
        <Link
          to="/app/wallet"
          className="mt-6 flex items-center gap-3 rounded-3xl bg-card p-4 shadow-soft transition-bounce hover:-translate-y-0.5"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <WalletIcon className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="font-display text-base font-extrabold">Eco Wallet</p>
            <p className="text-xs text-muted-foreground">Ver historial de puntos</p>
          </div>
        </Link>

        {/* ── Sección informativa "¿Cómo usar tu QR?" ── */}
        <div className="mb-4 mt-4 rounded-3xl bg-card p-5 shadow-soft">
          <h3 className="mb-3 font-display text-base font-bold">¿Cómo usar tu QR?</h3>
          <div className="space-y-3">
            {[
              {
                icon: "1️⃣",
                title: "Llega al punto de reciclaje",
                desc: "Dirígete a cualquier campus USIL habilitado.",
              },
              {
                icon: "2️⃣",
                title: "Muestra este QR al operador",
                desc: "El operador lo escaneará para validar tu identidad.",
              },
              {
                icon: "3️⃣",
                title: "Entrega tus materiales",
                desc: "Plástico, papel, vidrio o aluminio previamente separados.",
              },
              {
                icon: "4️⃣",
                title: "Acumula EcoPuntos",
                desc: "Los puntos se acreditan automáticamente a tu cuenta.",
              },
            ].map((step) => (
              <div key={step.icon} className="flex items-start gap-3">
                <span className="text-xl">{step.icon}</span>
                <div>
                  <p className="text-sm font-semibold">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/8 p-3">
            <p className="text-center text-xs font-semibold text-primary">
              🔒 Tu QR se renueva cada 60 segundos para mayor seguridad.
              No compartas capturas de pantalla con otros usuarios.
            </p>
          </div>
        </div>
      </div>
    </MobileShell>
  );
};

export default QrScreen;
