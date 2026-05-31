import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { useAuth } from "@/lib/auth";
import { generateQrToken } from "@/lib/api";
import { RefreshCw, ShieldCheck, Wallet as WalletIcon } from "lucide-react";
import QRCode from "qrcode";

const QrScreen = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [qrDataUrl, setQrDataUrl]   = useState<string>("");
  const [token, setToken]           = useState<string>("");
  const [expiresAt, setExpiresAt]   = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

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

  const fullName = profile?.full_name ?? "Usuario";
  const qrCode   = profile?.qr_code   ?? "";
  const points   = profile?.points    ?? 0;

  return (
    <MobileShell>
      <ScreenHeader title="Mi código QR" subtitle="Validación instantánea con recompensa" back />

      <div className="px-5">
        {/* ── Card con borde degradado (diseño original) ── */}
        <div className="rounded-[28px] bg-gradient-hero p-1 shadow-float">
          <div className="rounded-[24px] bg-card p-6">

            {/* Encabezado del usuario */}
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                RECIPE · QR personal
              </p>
              <h2 className="mt-1 font-display text-2xl font-extrabold">{fullName}</h2>
              <p className="text-sm text-muted-foreground">
                {qrCode} · {points} EcoPuntos
              </p>
            </div>

            {/* ── QR image ── */}
            <div className="mx-auto mt-5 flex items-center justify-center">
              {loading ? (
                <div className="h-[280px] w-[280px] animate-pulse rounded-3xl bg-muted" />
              ) : error ? (
                <div className="flex h-[280px] w-[280px] flex-col items-center justify-center rounded-3xl bg-destructive/10 p-6 text-center">
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
                  className="h-[280px] w-[280px] rounded-3xl shadow-card"
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

            {/* Botón renovar manual */}
            <div className="mt-3 flex justify-center">
              <button
                onClick={refreshQr}
                disabled={loading}
                className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Renovar ahora
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
      </div>
    </MobileShell>
  );
};

export default QrScreen;
