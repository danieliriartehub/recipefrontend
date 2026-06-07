import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { MobileShell } from "@/components/recipe/MobileShell";
import { useAuth } from "@/lib/auth";
import {
  getCenters,
  getWalletEntries,
  getMissionsWithProgress,
  getNotifications,
  getUserBalance,
} from "@/lib/api";
import { getEcoTitle } from "@/data/mock";
import {
  Bell,
  ChevronRight,
  Flame,
  MapPin,
  QrCode,
  Sparkles,
  Navigation,
  ScanLine,
  ShoppingBag,
  Wallet as WalletIcon,
  Target,
  Calculator,
} from "lucide-react";

// ─── Constantes de niveles (fuente única de verdad) ─────────────────────────
const LEVEL_NAMES      = ["Semilla", "Brote", "Sembrador", "Eco Warrior", "Guardián Verde", "Leyenda Eco"];
const LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 5000, 10000];
const LEVEL_EMOJIS     = ["🌱", "🌿", "🌳", "⚡", "🌍", "🏆"];
// Iniciales de días de la semana (0=Dom … 6=Sáb)
const DAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"] as const;

// ─── Skeletons ────────────────────────────────────────────────────────────────
const Skeleton = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-2xl bg-muted ${className}`} />
);

// ─── Distancia Haversine (km) ─────────────────────────────────────────────────
function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
/** Devuelve el string YYYY-MM-DD para un Date en hora local */
function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Componente principal ─────────────────────────────────────────────────────
const Dashboard = () => {
  const { profile, user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  // Suscripción Realtime — cuando el validador registra un reciclaje,
  // refrescamos el perfil (puntos) y el historial de wallet en el dashboard
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`dashboard:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'recyclings',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          refreshProfile()
          queryClient.invalidateQueries({ queryKey: ['wallet', user.id] })
          queryClient.invalidateQueries({ queryKey: ['recyclings', user.id] })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id, queryClient, refreshProfile])

  // ── Detección offline ─────────────────────────────────────────────────────
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online",  on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // ── Geolocalización del usuario ───────────────────────────────────────────
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationError(true),
      { timeout: 5000 }
    );
  }, []);

  // ── Valores derivados del perfil ───────────────────────────────────────────
  const points      = profile?.points         ?? 0;
  const streak      = profile?.streak_days    ?? 0;
  const weeklyGoal  = profile?.weekly_goal_kg ?? 5;
  const totalKg     = profile?.total_kg       ?? 0;
  const firstName   = (profile?.full_name ?? "Usuario").split(" ")[0];

  // Derivar nivel directamente de los puntos (evita desync con profile.level_index)
  const levelIndex  = LEVEL_THRESHOLDS.filter(t => points >= t).length - 1;
  const isMaxLevel  = levelIndex >= LEVEL_NAMES.length - 1;
  const prevLevelAt = LEVEL_THRESHOLDS[levelIndex] ?? 0;
  const nextLevelAt = LEVEL_THRESHOLDS[levelIndex + 1] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const nextLevel   = LEVEL_NAMES[levelIndex + 1] ?? "Leyenda Eco";
  const rangeSize   = nextLevelAt - prevLevelAt;
  const progress    = isMaxLevel ? 100 : Math.min(100, Math.round(((points - prevLevelAt) / rangeSize) * 100));
  const title       = getEcoTitle(points);

  // ── Fallback de balance para total_kg / co2_saved_kg si profile no los tiene aún ──
  const { data: balanceFallback } = useQuery({
    queryKey: ["balance", user?.id],
    queryFn: () => getUserBalance(user!.id),
    enabled: !!user && !profile?.total_kg,
    staleTime: 1000 * 60 * 2,
  });

  // Usa datos del profile (actualizados por Realtime) o el fallback
  const totalKgFinal = profile?.total_kg ?? balanceFallback?.total_kg ?? 0;
  const co2Final     = profile?.co2_saved_kg ?? balanceFallback?.co2_saved_kg ?? 0;

  // ── Queries a Supabase ────────────────────────────────────────────────────
  const { data: centers = [], isLoading: loadingCenters } = useQuery({
    queryKey: ["centers"],
    queryFn: getCenters,
    staleTime: 1000 * 60 * 5,
  });

  const { data: wallet = [], isLoading: loadingWallet } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: () => getWalletEntries(user!.id),
    enabled: !!user,
  });

  const { data: missions = [], isLoading: loadingMissions } = useQuery({
    queryKey: ["missions", user?.id],
    queryFn: () => getMissionsWithProgress(user!.id),
    enabled: !!user,
  });

  const { data: notifications = [], isLoading: loadingNotifs } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: () => getNotifications(user!.id),
    enabled: !!user,
  });

  // ── Centro recomendado — el más cercano al usuario con status abierto ────────
  const nearestCenter = useMemo(() => {
    if (!userLocation || !(centers as any[]).length) return null;
    return [...(centers as any[])]
      .filter((c) => c.status === "abierto")
      .sort((a, b) =>
        getDistanceKm(userLocation.lat, userLocation.lng, a.lat, a.lng) -
        getDistanceKm(userLocation.lat, userLocation.lng, b.lat, b.lng)
      )[0] ?? null;
  }, [centers, userLocation]);

  // ── Misiones diarias ──────────────────────────────────────────────────────
  // getMissionsWithProgress hace un left-join con user_missions.
  // Supabase puede devolver el embedded resource como:
  //   • []          → no hay registro de user_mission (usuario nuevo)
  //   • null        → ídem, en algunas versiones de PostgREST
  //   • [{ done }]  → hay un registro
  //   • { done }    → objeto (no array) si PostgREST aplana el join
  // En todos los casos: done=true SOLO si existe un registro explícito con done===true.
  const parseDone = (um: unknown): boolean => {
    if (!um) return false;
    if (Array.isArray(um)) return um.length > 0 && um[0]?.done === true;
    if (typeof um === "object") return (um as Record<string, unknown>).done === true;
    return false;
  };

  const dailyMissions = useMemo(() => {
    return (missions as any[])
      .filter((m) => m.type === "diaria")
      .map((m) => ({
        id:    m.id as string,
        title: m.title as string,
        emoji: (m.emoji as string | null) ?? "🎯",
        xp:    (m.xp_reward ?? m.xp ?? 0) as number,
        done:  parseDone(m.user_missions),
      }));
  }, [missions]);

  const completedDaily = dailyMissions.filter((m) => m.done).length;

  // ── Gráfico de actividad semanal ──────────────────────────────────────────
  // Agrupa los puntos ganados (tipo "earned") de wallet_entries por día,
  // para los últimos 7 días. Cada barra representa actividad relativa.
  const weeklyBars = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - i)); // i=0 → hace 6 días, i=6 → hoy
      const dayStr  = toLocalDate(day);
      const label   = DAY_LABELS[day.getDay()];
      const earned  = (wallet as any[])
        .filter((e) => e.points > 0 && (e.created_at as string | undefined)?.startsWith(dayStr))
        .reduce((sum, e) => sum + ((e.points as number) ?? 0), 0);
      return { label, value: earned, isToday: i === 6 };
    });
  }, [wallet]);

  const maxBar = Math.max(...weeklyBars.map((b) => b.value), 1);

  // Meta semanal: kilos reciclados en total (profile) vs. goal
  const weeklyPct = Math.min(100, Math.round((totalKgFinal / weeklyGoal) * 100));

  // ── Banner IA ─────────────────────────────────────────────────────────────
  const topNotif = (notifications as any[])[0] ?? null;
  const hasUnread = (notifications as any[]).some((n) => !n.read);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <MobileShell>

      {/* ── Banner offline — visible cuando no hay conexión ── */}
      {!isOnline && (
        <div className="sticky top-0 z-50 flex items-center gap-2 bg-yellow-400/95 px-4 py-2.5 text-sm font-semibold text-yellow-900 backdrop-blur">
          📡 Sin conexión — mostrando datos guardados
        </div>
      )}

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),20px)] pb-2">
        <div>
          <p className="text-xs text-muted-foreground">Hola,</p>
          <p className="font-display text-lg font-extrabold leading-none">{firstName} 👋</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/app/wallet"
            aria-label="Wallet"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted hover:bg-muted/70"
          >
            <WalletIcon className="h-5 w-5" />
          </Link>
          <Link
            to="/app/notifications"
            aria-label="Notificaciones"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-muted hover:bg-muted/70"
          >
            <Bell className="h-5 w-5" />
            {hasUnread && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent animate-pulse-glow" />
            )}
          </Link>
        </div>
      </header>

      {/* ── HERO — puntos + nivel ── */}
      <section className="px-5 pt-2">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-card">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-accent/20 blur-2xl" />

          <div className="relative flex items-start justify-between">
            <div>
              {/* Badges: título decorativo + nivel de gamificación */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${title.color} px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider`}>
                  <span>{title.emoji}</span> {title.title}
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold backdrop-blur border border-white/10">
                  {LEVEL_EMOJIS[levelIndex]} {LEVEL_NAMES[levelIndex]}
                </div>
              </div>
              <p className="mt-3 font-display text-[44px] font-extrabold leading-none">
                {points.toLocaleString()}
              </p>
              <p className="mt-0.5 text-[11px] opacity-75">EcoPuntos acumulados</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 backdrop-blur">
                <Flame className="h-4 w-4" />
                <span className="text-sm font-bold">{streak}d</span>
              </div>
              <Link to="/app/wallet" className="text-[11px] font-semibold underline opacity-90">
                Ver historial
              </Link>
            </div>
          </div>

          {/* Barra de progreso al siguiente nivel */}
          <div className="relative mt-4">
            <div className="flex items-center justify-between text-[11px] mb-1.5 font-semibold">
              <span>{LEVEL_EMOJIS[levelIndex]} {LEVEL_NAMES[levelIndex]}</span>
              {isMaxLevel ? (
                <span className="opacity-90">🏆 Nivel máximo</span>
              ) : (
                <span className="opacity-75">{nextLevel} {LEVEL_EMOJIS[levelIndex + 1]}</span>
              )}
            </div>
            <div className="relative h-2.5 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent via-yellow-300 to-white transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[10px]">
              <span className="opacity-60">{progress}% del nivel</span>
              {isMaxLevel ? (
                <span className="font-bold opacity-90">¡Leyenda Eco! 🌍</span>
              ) : (
                <span className="font-semibold">
                  {(nextLevelAt - points).toLocaleString()} pts para {nextLevel} →
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Banner IA / notificaciones ── */}
      <section className="px-5 pt-4">
        {loadingNotifs ? (
          <Skeleton className="h-[60px] rounded-2xl" />
        ) : topNotif ? (
          <Link
            to="/app/notifications"
            className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 transition-bounce hover:-translate-y-0.5"
          >
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                {topNotif.type} · IA
              </p>
              <p className="truncate text-sm font-bold">{topNotif.title}</p>
            </div>
            <ChevronRight className="h-4 w-4 flex-none text-primary" />
          </Link>
        ) : (
          /* Sin notificaciones reales → empty state */
          <div className="flex flex-col items-center justify-center rounded-2xl bg-muted/40 py-5 text-center">
            <p className="text-2xl">🌱</p>
            <p className="mt-2 text-sm font-semibold text-muted-foreground">
              No hay datos disponibles aún
            </p>
          </div>
        )}
      </section>

      {/* ── Quick actions (estático, no requiere datos remotos) ── */}
      <section className="px-5 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/app/scan"
            className="group relative overflow-hidden rounded-3xl bg-gradient-primary p-4 text-primary-foreground shadow-glow transition-bounce hover:-translate-y-0.5"
          >
            <ScanLine className="h-7 w-7" />
            <p className="mt-3 font-display text-base font-extrabold leading-tight">
              Escanear<br />residuo
            </p>
            <p className="text-[10px] opacity-85">IA al instante</p>
            <span className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-white/10 blur-xl" />
          </Link>

          <Link
            to="/app/map"
            className="rounded-3xl bg-card p-4 shadow-card transition-bounce hover:-translate-y-0.5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
              <MapPin className="h-5 w-5" />
            </span>
            <p className="mt-3 font-display text-base font-extrabold leading-tight">
              Centros<br />cercanos
            </p>
            <p className="text-[10px] text-muted-foreground">Mapa en tiempo real</p>
          </Link>

          <Link
            to="/app/marketplace"
            className="rounded-3xl bg-card p-4 shadow-card transition-bounce hover:-translate-y-0.5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <p className="mt-3 font-display text-base font-extrabold leading-tight">
              Eco<br />Marketplace
            </p>
            <p className="text-[10px] text-muted-foreground">Canjea recompensas</p>
          </Link>

          <Link
            to="/app/qr"
            className="rounded-3xl bg-card p-4 shadow-card transition-bounce hover:-translate-y-0.5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <QrCode className="h-5 w-5" />
            </span>
            <p className="mt-3 font-display text-base font-extrabold leading-tight">
              Mi QR<br />RECIPE
            </p>
            <p className="text-[10px] text-muted-foreground">Validación rápida</p>
          </Link>

          <Link
            to="/app/simulator"
            className="col-span-2 flex items-center gap-4 rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10 p-4 shadow-soft transition-bounce hover:-translate-y-0.5"
          >
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Calculator className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-extrabold leading-tight">Eco Simulator</p>
              <p className="text-[10px] text-muted-foreground">
                Calcula puntos e impacto antes de reciclar
              </p>
            </div>
            <ChevronRight className="h-5 w-5 flex-none text-primary" />
          </Link>
        </div>
      </section>

      {/* ── Centro recomendado — más cercano según geolocalización ── */}
      <section className="px-5 pt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-muted-foreground">RECOMENDADO POR IA</h3>
          <Link to="/app/map" className="text-xs font-semibold text-primary">Ver mapa →</Link>
        </div>

        {/* Cargando centros o esperando permiso de ubicación */}
        {(loadingCenters || (!userLocation && !locationError)) ? (
          <Skeleton className="h-24" />
        ) : locationError || !nearestCenter ? (
          /* Sin permiso de ubicación o sin centros abiertos */
          <Link
            to="/app/map"
            className="flex items-center gap-3 rounded-3xl bg-card p-5 shadow-soft transition-bounce hover:-translate-y-0.5"
          >
            <MapPin className="h-8 w-8 flex-none text-muted-foreground" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Activa tu ubicación</p>
              <p className="text-xs text-muted-foreground">
                para ver el centro más cercano
              </p>
            </div>
            <ChevronRight className="h-5 w-5 flex-none text-muted-foreground" />
          </Link>
        ) : (
          /* Centro más cercano con distancia real */
          <Link
            to={`/app/center/${nearestCenter.id}`}
            className="block rounded-3xl bg-card p-4 shadow-soft transition-bounce hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="truncate font-display text-base font-extrabold">{nearestCenter.name}</h4>
                  <span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                    Abierto
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {nearestCenter.district} · {nearestCenter.address}
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1 font-semibold">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {getDistanceKm(
                      userLocation!.lat, userLocation!.lng,
                      nearestCenter.lat, nearestCenter.lng
                    ).toFixed(1)} km
                  </span>
                  <span className="flex items-center gap-1 font-semibold">
                    <Navigation className="h-3.5 w-3.5 text-primary" />
                    ~{nearestCenter.wait_minutes ?? 0} min espera
                  </span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        )}
      </section>

      {/* ── Misiones del día ── */}
      <section className="px-5 pt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-muted-foreground">MISIONES DE HOY</h3>
          <span className="text-xs font-bold text-primary">
            {completedDaily}/{dailyMissions.length}
          </span>
        </div>

        <div className="rounded-3xl bg-card p-4 shadow-soft">
          {loadingMissions ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[46px]" />)}
            </div>
          ) : dailyMissions.length === 0 ? (
            /* Usuario nuevo o sin misiones activas */
            <div className="py-4 text-center">
              <p className="text-2xl">🎯</p>
              <p className="mt-2 text-sm font-semibold">Sin misiones activas hoy</p>
              <p className="text-xs text-muted-foreground">
                Vuelve mañana o recicla para desbloquear retos
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {dailyMissions.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-center gap-3 rounded-2xl p-2.5 transition-smooth ${
                    m.done ? "bg-success/10" : "bg-muted/40"
                  }`}
                >
                  <span className="text-xl">{m.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${m.done && "line-through opacity-70"}`}>
                      {m.title}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                      m.done
                        ? "bg-success text-success-foreground"
                        : "bg-primary/15 text-primary"
                    }`}
                  >
                    {m.done ? "✓" : `+${m.xp}xp`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Meta semanal + gráfico de actividad ── */}
      <section className="px-5 pt-5">
        <div className="rounded-3xl bg-card p-4 shadow-soft">
          {/* Encabezado kg / meta */}
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Meta semanal</p>
                <p className="font-display text-xl font-extrabold">
                  {totalKgFinal.toFixed(1)}{" "}
                  <span className="text-sm text-muted-foreground">/ {weeklyGoal} kg</span>
                </p>
              </div>
            </div>
            <p className="text-sm font-bold text-primary">{weeklyPct}%</p>
          </div>

          {/* Gráfico: puntos ganados por día (últimos 7 días desde wallet_entries) */}
          {loadingWallet ? (
            <div className="mt-3 h-16 animate-pulse rounded-xl bg-muted" />
          ) : wallet.length === 0 ? (
            /* Sin entradas de wallet → empty state */
            <div className="mt-3 flex flex-col items-center justify-center py-4 text-center">
              <p className="text-2xl">🌱</p>
              <p className="mt-1 text-sm text-muted-foreground">No hay datos disponibles aún</p>
            </div>
          ) : (
            <div className="mt-3 flex h-16 items-end justify-between gap-1.5">
              {weeklyBars.map((bar, i) => {
                const h = bar.value === 0 ? 8 : Math.max(12, (bar.value / maxBar) * 100);
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${
                        bar.value === 0
                          ? "bg-muted"
                          : bar.isToday
                          ? "bg-gradient-primary"
                          : "bg-primary/30"
                      }`}
                      style={{ height: `${h}%` }}
                    />
                    <span
                      className={`text-[10px] ${
                        bar.isToday ? "font-bold text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {bar.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Reto USIL — próximamente ── */}
      <section className="px-5 pt-4 pb-2">
        <div className="rounded-2xl bg-card p-4 shadow-soft">
          <p className="text-sm font-bold">🏆 Reto USIL</p>
          <p className="text-xs text-muted-foreground">
            Próximamente · Compite con tu facultad
          </p>
        </div>
      </section>

    </MobileShell>
  );
};

export default Dashboard;
