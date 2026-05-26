import { Link } from "react-router-dom";
import { MobileShell } from "@/components/recipe/MobileShell";
import { useAuth } from "@/lib/auth";
import {
  CENTERS,
  RECOMMENDED_CENTER_ID,
  MISSIONS,
  STATUS_META,
  WEEKLY_KG,
  WEEK_LABELS,
  getEcoTitle,
  SMART_NOTIFICATIONS,
} from "@/data/mock";
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

// ─── Niveles y umbrales (deben coincidir con los de la base de datos) ─────────
const LEVEL_NAMES = ["Semilla", "Brote", "Sembrador", "Eco Warrior", "Guardián Verde", "Leyenda Eco"];
const LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 5000, 10000];

const Dashboard = () => {
  const { profile } = useAuth();

  // ── Datos del usuario: reales si existen, defaults para usuario nuevo ──────
  const levelIndex  = profile?.level_index  ?? 0;
  const points      = profile?.points       ?? 0;
  const streak      = profile?.streak_days  ?? 0;
  const weeklyGoal  = profile?.weekly_goal_kg ?? 5;
  const firstName   = (profile?.full_name ?? "Usuario").split(" ")[0];

  const nextLevelAt = LEVEL_THRESHOLDS[levelIndex + 1] ?? 10000;
  const nextLevel   = LEVEL_NAMES[levelIndex + 1] ?? "Leyenda Eco";

  // weeklyDoneKg: viene del perfil cuando esté disponible en la DB,
  // mientras tanto mostramos 0 para usuarios nuevos reales.
  const weeklyDone  = 0;

  const progress = Math.min(100, Math.round((points / nextLevelAt) * 100));
  const weekly   = Math.min(100, Math.round((weeklyDone / weeklyGoal) * 100));

  const title        = getEcoTitle(points);
  const rec          = CENTERS.find((c) => c.id === RECOMMENDED_CENTER_ID)!;
  const recStatus    = STATUS_META[rec.status];
  const maxWeek      = Math.max(...WEEKLY_KG, 1);
  const dailyMissions    = MISSIONS.filter((m) => m.type === "diaria");
  const completedDaily   = dailyMissions.filter((m) => m.done).length;
  const topSmart         = SMART_NOTIFICATIONS[0];

  return (
    <MobileShell>
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
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent animate-pulse-glow" />
          </Link>
        </div>
      </header>

      {/* ── HERO — saldo + título ecológico ── */}
      <section className="px-5 pt-2">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-card">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-accent/20 blur-2xl" />

          <div className="relative flex items-start justify-between">
            <div>
              <div
                className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${title.color} px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider`}
              >
                <span>{title.emoji}</span> {title.title}
              </div>
              <p className="mt-3 font-display text-[44px] font-extrabold leading-none">
                {points.toLocaleString()}
              </p>
              <p className="mt-1 text-xs opacity-85">
                EcoPuntos · faltan {nextLevelAt - points} para {nextLevel}
              </p>
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

          <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-white"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>

      {/* ── Banner IA ── */}
      <section className="px-5 pt-4">
        <Link
          to="/app/notifications"
          className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-3 transition-bounce hover:-translate-y-0.5"
        >
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
              {topSmart.aiTag} · IA
            </p>
            <p className="truncate text-sm font-bold">{topSmart.title}</p>
          </div>
          <ChevronRight className="h-4 w-4 flex-none text-primary" />
        </Link>
      </section>

      {/* ── Quick actions ── */}
      <section className="px-5 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/app/scan"
            className="group relative overflow-hidden rounded-3xl bg-gradient-primary p-4 text-primary-foreground shadow-glow transition-bounce hover:-translate-y-0.5"
          >
            <ScanLine className="h-7 w-7" />
            <p className="mt-3 font-display text-base font-extrabold leading-tight">
              Escanear
              <br />
              residuo
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
              Centros
              <br />
              cercanos
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
              Eco
              <br />
              Marketplace
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
              Mi QR
              <br />
              RECIPE
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

      {/* ── Centro recomendado ── */}
      <section className="px-5 pt-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-sm font-bold text-muted-foreground">RECOMENDADO POR IA</h3>
          <Link to="/app/map" className="text-xs font-semibold text-primary">
            Ver mapa →
          </Link>
        </div>
        <Link
          to={`/app/center/${rec.id}`}
          className="block rounded-3xl bg-card p-4 shadow-soft transition-bounce hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="truncate font-display text-base font-extrabold">{rec.name}</h4>
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${recStatus.bg} ${recStatus.text}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${recStatus.dot} animate-pulse`} />
                  {recStatus.label}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {rec.district} · {rec.address}
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 font-semibold">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {rec.distanceKm} km
                </span>
                <span className="flex items-center gap-1 font-semibold">
                  <Navigation className="h-3.5 w-3.5 text-primary" />
                  {rec.etaMin} min
                </span>
                <span className="font-semibold text-success">~{rec.waitMin} min</span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Link>
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
                  <p
                    className={`truncate text-sm font-semibold ${
                      m.done && "line-through opacity-70"
                    }`}
                  >
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
        </div>
      </section>

      {/* ── Meta semanal ── */}
      <section className="px-5 pt-5">
        <div className="rounded-3xl bg-card p-4 shadow-soft">
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Meta semanal</p>
                <p className="font-display text-xl font-extrabold">
                  {weeklyDone}{" "}
                  <span className="text-sm text-muted-foreground">/ {weeklyGoal} kg</span>
                </p>
              </div>
            </div>
            <p className="text-sm font-bold text-primary">{weekly}%</p>
          </div>
          <div className="mt-3 flex h-16 items-end justify-between gap-1.5">
            {WEEKLY_KG.map((v, i) => {
              const h = Math.max(8, (v / maxWeek) * 100);
              const today = i === 3;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-md ${
                      v === 0
                        ? "bg-muted"
                        : today
                        ? "bg-gradient-primary"
                        : "bg-primary/30"
                    }`}
                    style={{ height: `${h}%` }}
                  />
                  <span
                    className={`text-[10px] ${
                      today ? "font-bold text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {WEEK_LABELS[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Comunidad ── */}
      <section className="px-5 pt-4 pb-2">
        <Link
          to="/app/community"
          className="flex items-center gap-3 rounded-3xl border border-border bg-card p-4 transition-bounce hover:-translate-y-0.5"
        >
          <span className="text-3xl">🏆</span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-extrabold">Reto PUCP vs UNI</p>
            <p className="text-xs text-muted-foreground">
              Tu universidad va #1 — sigue sumando kilos
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      </section>
    </MobileShell>
  );
};

export default Dashboard;
