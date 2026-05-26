import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MobileShell } from "@/components/recipe/MobileShell";
import { useAuth } from "@/lib/auth";
import { updateProfile } from "@/lib/api";
import { BADGES, MATERIALS, ACTIVITY, CENTERS } from "@/data/mock";
import { getEcoTitle } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bell, ChevronRight, HelpCircle, Leaf, LogOut, Pencil, Settings,
  Shield, Ticket, ShoppingBag, Wallet as WalletIcon, Trophy,
  Calculator, TreePine, Droplets, Wind, Loader2,
} from "lucide-react";
import { toast } from "sonner";

// ─── Niveles ─────────────────────────────────────────────────────────────────
const LEVEL_NAMES = ["Semilla", "Brote", "Sembrador", "Eco Warrior", "Guardián Verde", "Leyenda Eco"];
const LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 5000, 10000];

const Profile = () => {
  const { profile, user, signOut, refreshProfile } = useAuth();
  const nav = useNavigate();

  // ─── Edición ───────────────────────────────────────────────────────────────
  const [editing, setEditing]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [editName, setEditName]   = useState("");
  const [editCareer, setEditCareer] = useState("");

  const startEdit = () => {
    setEditName(profile?.full_name ?? "");
    setEditCareer(profile?.career ?? "");
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, {
        full_name: editName.trim() || undefined,
        career: editCareer.trim() || undefined,
      });
      await refreshProfile();
      toast.success("Perfil actualizado ✅");
      setEditing(false);
    } catch (err) {
      toast.error("No se pudo guardar. Intenta de nuevo.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    // replace:true reemplaza la entrada en el historial → el botón Atrás del
    // celular no puede regresar a /app después de cerrar sesión
    nav("/auth", { replace: true });
  };

  // ─── Datos del perfil con defaults para usuario nuevo ─────────────────────
  const levelIndex  = profile?.level_index  ?? 0;
  const points      = profile?.points       ?? 0;
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

  // Impacto derivado de los datos reales
  const impactCo2     = co2Saved;
  const impactTrees   = +(co2Saved / 21).toFixed(2);
  const impactWater   = Math.round(totalKg * 18);

  const unlockedBadges = BADGES.filter((b) => b.unlocked); // mock hasta que haya DB

  const menu = [
    { icon: WalletIcon,  label: "Eco Wallet",             to: "/app/wallet" },
    { icon: ShoppingBag, label: "Marketplace",             to: "/app/marketplace" },
    { icon: Calculator,  label: "Eco Simulator",           to: "/app/simulator" },
    { icon: Ticket,      label: "Mis cupones",             to: "/app/coupons" },
    { icon: Trophy,      label: "Comunidad",               to: "/app/community" },
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
            onClick={editing ? saveEdit : startEdit}
            disabled={saving}
            className="flex h-10 items-center gap-1.5 rounded-full bg-white/15 px-3 backdrop-blur disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
            <span className="text-xs font-bold">
              {saving ? "Guardando…" : editing ? "Guardar" : "Editar"}
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

        {/* Barra de progreso */}
        <div className="relative mt-5 rounded-2xl bg-white/15 p-4 backdrop-blur">
          <div className="flex justify-between text-xs font-semibold">
            <span>🌿 {levelName}</span>
            <span>{points} / {nextLevelAt} pts</span>
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
            <Link to="/app/community" className="text-xs font-semibold text-primary">
              Ver todos →
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {unlockedBadges.length > 0 ? (
              unlockedBadges.map((b) => (
                <div
                  key={b.id}
                  className="flex w-20 flex-none flex-col items-center rounded-2xl bg-muted/40 p-2 text-center"
                >
                  <span className="text-2xl">{b.emoji}</span>
                  <p className="mt-1 line-clamp-1 text-[10px] font-bold">{b.name}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground py-2">
                Aún no has desbloqueado badges. ¡Empieza a reciclar! 🌱
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="px-5 pt-5 grid grid-cols-3 gap-2">
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
        <section className="mx-5 mt-5 space-y-3 rounded-3xl bg-card p-5 shadow-soft animate-slide-up">
          <p className="font-display text-base font-bold">Editar datos</p>
          <div className="space-y-1.5">
            <Label>Nombre completo</Label>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-11 rounded-xl"
              placeholder="Tu nombre"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Carrera</Label>
            <Input
              value={editCareer}
              onChange={(e) => setEditCareer(e.target.value)}
              className="h-11 rounded-xl"
              placeholder="Ej. Ingeniería Ambiental"
            />
          </div>
          <Button
            onClick={saveEdit}
            disabled={saving}
            className="h-11 w-full rounded-xl bg-gradient-primary font-bold"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar cambios"}
          </Button>
        </section>
      )}

      {/* ── Historial reciente (mock hasta tener recyclings en DB) ── */}
      <section className="mx-5 mt-5 rounded-3xl bg-card p-5 shadow-soft">
        <p className="mb-3 font-display text-base font-bold">Historial reciente</p>
        {ACTIVITY.length > 0 ? (
          <div className="space-y-2">
            {ACTIVITY.map((a) => {
              const m = MATERIALS[a.material];
              const c = CENTERS.find((x) => x.id === a.centerId);
              return (
                <div key={a.id} className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card text-xl">
                    {m.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {m.label} · {a.kg} kg
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {c?.name} · {a.date}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary">+{a.points}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-4">
            Aún no tienes reciclajes registrados.
          </p>
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
