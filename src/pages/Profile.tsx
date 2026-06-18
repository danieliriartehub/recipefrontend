import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MobileShell } from "@/components/recipe/MobileShell";
import { useAuth } from "@/lib/auth";
import { getUserBalance, getRecentTransactions, updateProfile } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronRight, HelpCircle, LogOut, Pencil, Settings,
  Shield, Ticket, ShoppingBag, Wallet as WalletIcon, Trophy,
  Calculator, ArrowDownLeft, ArrowUpRight, Loader2, X, Crown,
} from "lucide-react";
import { toast } from "sonner";

// ─── Niveles ─────────────────────────────────────────────────────────────────
const LEVEL_NAMES = ["Semilla", "Brote", "Sembrador", "Eco Warrior", "Guardián Verde", "Leyenda Eco"];
const LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 5000, 10000];
const LEVEL_EMOJIS = ["🌱", "🌿", "🌳", "⚡", "🌍", "🏆"];

// ─── Componente ───────────────────────────────────────────────────────────────
const Profile = () => {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const nav = useNavigate();
  const queryClient = useQueryClient();
  // ─── Saldo real desde user_balance (fuente única) ─────────────────────────
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ["balance", user?.id],
    queryFn: () => getUserBalance(user!.id),
    enabled: !!user,
  });

  // ─── Últimas 5 transacciones desde wallet_history ────────────────────────
  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: () => getRecentTransactions(user!.id),
    enabled: !!user,
    staleTime: 0,
  });

  const { mutateAsync: updateProfileMut, isPending } = useMutation({
    mutationFn: (updates: { full_name?: string; username?: string; career?: string }) =>
      updateProfile(user!.id, updates),
    onSuccess: async () => {
      await refreshProfile();
      toast.success("Perfil actualizado correctamente");
      setIsEditing(false);
    },
    onError: () => {
      toast.error("Ocurrió un error al actualizar el perfil");
    },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    username: "",
    career: "",
  });

  const handleEditClick = () => {
    setEditForm({
      full_name: profile?.full_name ?? "",
      username: profile?.username ?? "",
      career: profile?.career ?? "",
    });
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.full_name.trim() || !editForm.username.trim()) {
      toast.error("Nombre y username son obligatorios");
      return;
    }
    await updateProfileMut(editForm);
  };

  const handleSignOut = async () => {
    await signOut();
    nav("/auth", { replace: true });
  };

  // ─── Datos del perfil ─────────────────────────────────────────────────────
  const points = profile?.points ?? 0; // solo para calcular % de progreso
  const streak = profile?.streak_days ?? 0;
  const totalKg = profile?.total_kg ?? 0;
  const co2Saved = profile?.co2_saved_kg ?? 0;

  // Derivar nivel directamente de los puntos (evita desync con profile.level_index)
  const levelIndex = LEVEL_THRESHOLDS.filter(t => points >= t).length - 1;
  const isMaxLevel = levelIndex >= LEVEL_NAMES.length - 1;
  const prevLevelAt = LEVEL_THRESHOLDS[levelIndex] ?? 0;
  const nextLevelAt = LEVEL_THRESHOLDS[levelIndex + 1] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const levelName = LEVEL_NAMES[levelIndex] ?? "Semilla";
  const nextLevel = LEVEL_NAMES[levelIndex + 1] ?? "Leyenda Eco";
  const rangeSize = nextLevelAt - prevLevelAt;
  const progress = isMaxLevel ? 100 : Math.min(100, Math.round(((points - prevLevelAt) / rangeSize) * 100));
  const initials = profile?.avatar_initials ?? "?";
  const fullName = profile?.full_name ?? "Usuario";
  const username = profile?.username ?? null;
  const career = profile?.career ?? null;

  const impactCo2 = co2Saved;
  const impactTrees = +(co2Saved / 21).toFixed(2);
  const impactWater = Math.round(totalKg * 18);

  const menu = [
    { icon: WalletIcon, label: "Eco Wallet", to: "/app/wallet" },
    { icon: ShoppingBag, label: "Marketplace", to: "/app/marketplace" },
    { icon: Calculator, label: "Eco Simulator", to: "/app/simulator" },
    { icon: Ticket, label: "Mis cupones", to: "/app/coupons" },
    { icon: Shield, label: "Privacidad y seguridad", to: "#" },
    { icon: Settings, label: "Configuración", to: "#" },
    { icon: HelpCircle, label: "Ayuda y soporte", to: "#" },
  ];

  if (isEditing) {
    return (
      <MobileShell>
        <header className="relative overflow-hidden rounded-b-[32px] bg-gradient-hero px-5 pb-8 pt-[max(env(safe-area-inset-top),20px)] text-primary-foreground">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <h1 className="font-display text-xl font-extrabold">Editar Perfil</h1>
            <button
              onClick={() => setIsEditing(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <section className="px-5 pt-6 pb-20">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold ml-1">Nombre completo <span className="text-destructive">*</span></label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Ej. Juan Pérez"
                className="h-12 rounded-2xl bg-muted/40 border-transparent focus-visible:ring-primary px-4"
                disabled={isPending}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold ml-1">Username <span className="text-destructive">*</span></label>
              <Input
                value={editForm.username}
                onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Ej. juanperez"
                className="h-12 rounded-2xl bg-muted/40 border-transparent focus-visible:ring-primary px-4"
                disabled={isPending}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-semibold ml-1">Carrera</label>
              <Input
                value={editForm.career}
                onChange={(e) => setEditForm(prev => ({ ...prev, career: e.target.value }))}
                placeholder="Ej. Ingeniería de Sistemas"
                className="h-12 rounded-2xl bg-muted/40 border-transparent focus-visible:ring-primary px-4"
                disabled={isPending}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 rounded-full mt-6 text-base font-bold shadow-soft"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Guardar cambios"}
            </Button>
          </form>
        </section>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      {/* ── Header ── */}
      <header className="relative overflow-hidden rounded-b-[32px] bg-gradient-hero px-5 pb-8 pt-[max(env(safe-area-inset-top),20px)] text-primary-foreground">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <h1 className="font-display text-xl font-extrabold">Mi perfil</h1>
          <button
            onClick={handleEditClick}
            className="flex h-10 items-center gap-1.5 rounded-full bg-white/15 px-3 backdrop-blur"
          >
            <Pencil className="h-4 w-4" />
            <span className="text-xs font-bold">
              Editar
            </span>
          </button>
        </div>

        <div className="relative mt-5 flex items-center gap-4">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 font-display text-3xl font-extrabold backdrop-blur ring-4 ring-white/20">
              {initials}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-base shadow-card">
              {LEVEL_EMOJIS[levelIndex]}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-xl font-extrabold">{fullName}</p>
            {username && <p className="text-sm text-primary-foreground/80">{username}</p>}
            <div
              className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary-foreground"
            >
              Nivel {levelIndex}: {LEVEL_NAMES[levelIndex]}
            </div>
            {career && (
              <p className="mt-1 text-[11px] text-primary-foreground/75">{career}</p>
            )}
          </div>
        </div>

        {/* Tarjeta de puntos / barra de progreso */}
        <div className="relative mt-5 rounded-2xl bg-white/15 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-[11px] mb-1.5 font-semibold">
            <span>{LEVEL_EMOJIS[levelIndex]} {levelName}</span>
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
      </header>

      {/* ── Badges ── */}
      <section className="px-5 pt-5">
        <div className="rounded-3xl bg-card p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-sm font-bold">Badges desbloqueados</p>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <p className="py-2 text-xs text-muted-foreground">
              Aún no has desbloqueado badges. ¡Empieza a reciclar! 🌱
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="grid grid-cols-3 gap-2 px-5 pt-5">
        <div className="rounded-2xl bg-card p-3 text-center shadow-soft">
          <p className="font-display text-xl font-extrabold text-primary">
            {totalKg}<span className="text-xs">kg</span>
          </p>
          <p className="text-[11px] text-muted-foreground">Reciclados</p>
        </div>
        <div className="rounded-2xl bg-card p-3 text-center shadow-soft">
          <p className="font-display text-xl font-extrabold text-secondary">
            {co2Saved}<span className="text-xs">kg</span>
          </p>
          <p className="text-[11px] text-muted-foreground">CO₂ ahorrado</p>
        </div>
        <div className="rounded-2xl bg-card p-3 text-center shadow-soft">
          <p className="font-display text-xl font-extrabold text-accent-foreground">
            {streak}🔥
          </p>
          <p className="text-[11px] text-muted-foreground">Racha</p>
        </div>
      </section>



      {/* ── Historial reciente (wallet_history vía getRecentTransactions) ── */}
      <section className="mx-5 mt-5 rounded-3xl bg-card p-5 shadow-soft">
        <p className="mb-3 font-display text-base font-bold">Historial reciente</p>

        {txLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : (transactions as any[]).length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Aún no tienes movimientos registrados 🌱
          </p>
        ) : (
          <div className="space-y-2">
            {(transactions as any[]).map((tx) => {
              const isIn = tx.type === "IN" || (tx.title || tx.description || "").toLowerCase().includes("reciclaje") || !!tx.related_recycling_id;
              return (
                <div
                  key={tx.id ?? tx.transaction_id}
                  className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-card ${isIn ? "text-primary" : "text-destructive"}`}>
                    {isIn
                      ? <ArrowDownLeft className="h-5 w-5" />
                      : <ArrowUpRight className="h-5 w-5" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {tx.title ?? tx.description ?? (isIn ? "Reciclaje" : "Canje")} {tx.emoji ?? ""}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString("es-PE")}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${isIn ? "text-primary" : "text-destructive"}`}>
                    {isIn ? "+" : "-"}{tx.points ?? tx.amount ?? 0}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Membresía ReciPE PLUS ── */}
      <section className="mx-5 mt-5">
        <div 
          onClick={() => toast.info("Próximamente podrás suscribirte a ReciPE PLUS")}
          className="relative cursor-pointer overflow-hidden rounded-3xl bg-gradient-to-r from-yellow-500 to-amber-600 p-4 text-white shadow-soft transition-transform hover:scale-[1.02]"
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/20 blur-xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
                <Crown className="h-5 w-5 text-yellow-100" />
              </div>
              <div>
                <h3 className="font-display text-sm font-extrabold flex items-center gap-1.5">
                  ReciPE PLUS
                  <span className="rounded bg-white/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                    S/ 5.99
                  </span>
                </h3>
                <p className="text-xs text-yellow-50/90 mt-0.5">Disfruta la app sin anuncios</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-white/80" />
          </div>
        </div>
      </section>

      {/* ── Menú de navegación ── */}
      <section className="mx-5 mt-5 overflow-hidden rounded-3xl bg-card shadow-soft">
        {menu.map(({ icon: Icon, label, to }, i) => (
          <Link
            key={label}
            to={to}
            onClick={(e) => {
              if (to === "#") {
                e.preventDefault();
                toast.info("Próximamente");
              }
            }}
            className={`flex items-center gap-3 px-5 py-4 transition-smooth hover:bg-muted/40 ${i !== menu.length - 1 ? "border-b border-border" : ""
              }`}
          >
            <Icon className="h-5 w-5 text-primary" />
            <span className="flex-1 text-sm font-medium">{label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </section>

      {/* ── Cerrar sesión ── */}
      <div className="px-5 py-5">
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="h-12 w-full rounded-2xl border-2 border-destructive/30 text-destructive hover:bg-destructive/5"
        >
          <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
        </Button>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">RECIPE v1.0</p>
      </div>
    </MobileShell>
  );
};

export default Profile;
