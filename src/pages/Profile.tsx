import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MobileShell } from "@/components/recipe/MobileShell";
import { useAuth } from "@/lib/auth";
import { getUserWallet, getRecentWalletTransactions, updateProfile } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bell, ChevronRight, HelpCircle, Leaf, LogOut, Pencil, Settings,
  Shield, Ticket, ShoppingBag, Wallet as WalletIcon, Trophy,
  Calculator, TreePine, Droplets, Wind, Loader2,
  ArrowDownLeft, ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";

// ─── Niveles ─────────────────────────────────────────────────────────────────
const LEVEL_NAMES      = ["Semilla", "Brote", "Sembrador", "Eco Warrior", "Guardián Verde", "Leyenda Eco"];
const LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 5000, 10000];

const ECO_TITLES = [
  { min: 0,     emoji: "🌱", title: "Semilla",        color: "from-green-400 to-green-600" },
  { min: 500,   emoji: "🌿", title: "Brote",          color: "from-emerald-400 to-emerald-600" },
  { min: 1500,  emoji: "🌳", title: "Sembrador",      color: "from-teal-400 to-teal-600" },
  { min: 3000,  emoji: "⚡", title: "Eco Warrior",    color: "from-cyan-400 to-blue-500" },
  { min: 5000,  emoji: "🌍", title: "Guardián Verde", color: "from-blue-500 to-indigo-600" },
  { min: 10000, emoji: "🏆", title: "Leyenda Eco",    color: "from-purple-500 to-pink-500" },
];

function getEcoTitle(points: number) {
  return [...ECO_TITLES].reverse().find((t) => points >= t.min) ?? ECO_TITLES[0];
}

// ─── Validación Zod ───────────────────────────────────────────────────────────
const profileSchema = z.object({
  full_name: z.string().min(1, "Este campo es obligatorio"),
  username:  z.string().min(1, "Este campo es obligatorio"),
  email:     z.string().email("Correo electrónico inválido"),
});
type ProfileForm = z.infer<typeof profileSchema>;

// ─── Componente ───────────────────────────────────────────────────────────────
const Profile = () => {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  // ─── Saldo real desde user_wallet ─────────────────────────────────────────
  const { data: balance = 0, isLoading: balanceLoading } = useQuery({
    queryKey: ["wallet", user?.id],
    queryFn:  () => getUserWallet(user!.id),
    enabled:  !!user,
  });

  // ─── Últimos 5 movimientos ────────────────────────────────────────────────
  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["wallet_transactions", user?.id],
    queryFn:  () => getRecentWalletTransactions(user!.id),
    enabled:  !!user,
  });

  // ─── Formulario con validación ────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? "",
      username:  profile?.username  ?? "",
      email:     user?.email        ?? "",
    },
  });

  // Sincroniza cuando el perfil carga de forma asíncrona
  useEffect(() => {
    reset({
      full_name: profile?.full_name ?? "",
      username:  profile?.username  ?? "",
      email:     user?.email        ?? "",
    });
  }, [profile, user, reset]);

  // ─── Mutación guardar perfil ──────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: ({ full_name, username }: ProfileForm) =>
      updateProfile(user!.id, { full_name, username }),
    onSuccess: async () => {
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      toast.success("Perfil actualizado correctamente");
      setEditing(false);
    },
    onError: () => {
      toast.error("No se pudieron guardar los cambios. Inténtalo de nuevo");
    },
  });

  const handleSignOut = async () => {
    await signOut();
    nav("/auth", { replace: true });
  };

  // ─── Datos del perfil ─────────────────────────────────────────────────────
  const levelIndex  = profile?.level_index  ?? 0;
  const points      = profile?.points       ?? 0; // solo para calcular % de progreso
  const streak      = profile?.streak_days  ?? 0;
  const totalKg     = profile?.total_kg     ?? 0;
  const co2Saved    = profile?.co2_saved_kg ?? 0;
  const levelName   = LEVEL_NAMES[levelIndex]     ?? "Semilla";
  const nextLevel   = LEVEL_NAMES[levelIndex + 1] ?? "Leyenda Eco";
  const nextLevelAt = LEVEL_THRESHOLDS[levelIndex + 1] ?? 10000;
  const progress    = Math.min(100, Math.round((points / nextLevelAt) * 100));
  const title       = getEcoTitle(points);
  const initials    = profile?.avatar_initials ?? "?";
  const fullName    = profile?.full_name ?? "Usuario";
  const username    = profile?.username ?? null;
  const career      = profile?.career   ?? null;

  const impactCo2   = co2Saved;
  const impactTrees = +(co2Saved / 21).toFixed(2);
  const impactWater = Math.round(totalKg * 18);

  const menu = [
    { icon: WalletIcon,  label: "Eco Wallet",             to: "/app/wallet" },
    { icon: ShoppingBag, label: "Marketplace",             to: "/app/marketplace" },
    { icon: Calculator,  label: "Eco Simulator",           to: "/app/simulator" },
    { icon: Ticket,      label: "Mis cupones",             to: "/app/coupons" },
    { icon: Trophy,      label: "Mi impacto",              to: "/app/impact" },
    { icon: Bell,        label: "Notificaciones",          to: "/app/notifications" },
    { icon: Shield,      label: "Privacidad y seguridad",  to: "#" },
    { icon: Settings,    label: "Configuración",            to: "#" },
    { icon: HelpCircle,  label: "Ayuda y soporte",         to: "#" },
  ];

  return (
    <MobileShell>
      {/* ── Header ── */}
      <header className="relative overflow-hidden rounded-b-[32px] bg-gradient-hero px-5 pb-8 pt-[max(env(safe-area-inset-top),20px)] text-primary-foreground">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <h1 className="font-display text-xl font-extrabold">Mi perfil</h1>
          <button
            onClick={() =>
              editing
                ? handleSubmit((d) => mutation.mutate(d))()
                : setEditing(true)
            }
            disabled={editing && (!isDirty || !isValid || mutation.isPending)}
            className="flex h-10 items-center gap-1.5 rounded-full bg-white/15 px-3 backdrop-blur disabled:opacity-60"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
            <span className="text-xs font-bold">
              {mutation.isPending ? "Guardando…" : editing ? "Guardar" : "Editar"}
            </span>
          </button>
        </div>

        <div className="relative mt-5 flex items-center gap-4">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 font-display text-3xl font-extrabold backdrop-blur ring-4 ring-white/20">
              {initials}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-base shadow-card">
              {title.emoji}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-xl font-extrabold">{fullName}</p>
            {username && <p className="text-sm text-primary-foreground/80">{username}</p>}
            <div
              className={`mt-1.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${title.color} px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider`}
            >
              {title.title}
            </div>
            {career && (
              <p className="mt-1 text-[11px] text-primary-foreground/75">{career}</p>
            )}
          </div>
        </div>

        {/* Tarjeta de puntos / barra de progreso */}
        <div className="relative mt-5 rounded-2xl bg-white/15 p-4 backdrop-blur">
          <div className="flex justify-between text-xs font-semibold">
            <span>🌿 {levelName}</span>
            {balanceLoading ? (
              <div className="h-4 w-28 animate-pulse rounded bg-white/20" />
            ) : (
              <span>{(balance as number).toLocaleString()} EcoPuntos</span>
            )}
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-white"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-primary-foreground/80">
            Te faltan <strong>{nextLevelAt - points} pts</strong> para ser{" "}
            <strong>{nextLevel}</strong>
          </p>
        </div>
      </header>

      {/* ── Badges ── */}
      <section className="px-5 pt-5">
        <div className="rounded-3xl bg-card p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-sm font-bold">Badges desbloqueados</p>
            <Link to="/app/impact" className="text-xs font-semibold text-primary">
              Ver impacto →
            </Link>
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

      {/* ── Impacto resumen ── */}
      <section className="px-5 pt-5">
        <div className="overflow-hidden rounded-3xl bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Leaf className="h-4 w-4" />
              </span>
              <p className="font-display text-sm font-bold">Tu impacto</p>
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              Nivel #{levelIndex + 1}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 px-5 py-4">
            <MiniImpact icon={<Wind className="h-4 w-4" />}     value={`${impactCo2}`}   unit="kg" label="CO₂ evitado" />
            <MiniImpact icon={<TreePine className="h-4 w-4" />} value={`${impactTrees}`} unit=""   label="árboles/año" />
            <MiniImpact icon={<Droplets className="h-4 w-4" />} value={`${impactWater}`} unit="L"  label="agua" />
          </div>
          <Link
            to="/app/impact"
            className="flex items-center justify-between border-t border-border px-5 py-3 transition-smooth hover:bg-muted/40"
          >
            <span className="text-sm font-bold text-primary">Ver impacto completo</span>
            <ChevronRight className="h-4 w-4 text-primary" />
          </Link>
        </div>
      </section>

      {/* ── Formulario de edición ── */}
      {editing && (
        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d))}
          className="mx-5 mt-5 space-y-3 rounded-3xl bg-card p-5 shadow-soft animate-slide-up"
        >
          <p className="font-display text-base font-bold">Editar datos</p>

          <div className="space-y-1">
            <Label>Nombre completo</Label>
            <Input
              {...register("full_name")}
              className="h-11 rounded-xl"
              placeholder="Tu nombre"
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Nombre de usuario</Label>
            <Input
              {...register("username")}
              className="h-11 rounded-xl"
              placeholder="@usuario"
            />
            {errors.username && (
              <p className="mt-1 text-xs text-destructive">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label>Correo electrónico</Label>
            <Input
              {...register("email")}
              className="h-11 rounded-xl bg-muted/40"
              disabled
            />
            {errors.email && (
              <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={!isDirty || !isValid || mutation.isPending}
            className="h-11 w-full rounded-xl bg-gradient-primary font-bold"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </form>
      )}

      {/* ── Historial reciente (wallet_transactions) ── */}
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
              const isIn = tx.type === "IN";
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
                      {tx.description ?? (isIn ? "Reciclaje" : "Canje")}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString("es-PE")}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${isIn ? "text-primary" : "text-destructive"}`}>
                    {isIn ? "+" : "-"}{tx.amount ?? 0}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Menú de navegación ── */}
      <section className="mx-5 mt-5 overflow-hidden rounded-3xl bg-card shadow-soft">
        {menu.map(({ icon: Icon, label, to }, i) => (
          <Link
            key={label}
            to={to}
            className={`flex items-center gap-3 px-5 py-4 transition-smooth hover:bg-muted/40 ${
              i !== menu.length - 1 ? "border-b border-border" : ""
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

const MiniImpact = ({
  icon, value, unit, label,
}: {
  icon: React.ReactNode;
  value: string;
  unit: string;
  label: string;
}) => (
  <div className="rounded-2xl bg-muted/40 p-3">
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-card text-primary">
      {icon}
    </span>
    <p className="mt-2 font-display text-base font-extrabold leading-none">
      {value}
      <span className="ml-0.5 text-[10px] font-bold">{unit}</span>
    </p>
    <p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p>
  </div>
);

export default Profile;
