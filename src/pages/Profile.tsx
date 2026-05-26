import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ACTIVITY, CENTERS, MATERIALS, USER, BADGES, IMPACT, getEcoTitle } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bell, ChevronRight, HelpCircle, Leaf, LogOut, Pencil, Settings, Shield, Ticket, ShoppingBag, Wallet as WalletIcon, Trophy, Calculator, TreePine, Droplets, Wind } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const [editing, setEditing] = useState(false);
  const nav = useNavigate();
  const progress = Math.min(100, Math.round((USER.points / USER.nextLevelAt) * 100));
  const title = getEcoTitle(USER.points);
  const unlockedBadges = BADGES.filter((b) => b.unlocked);

  const menu = [
    { icon: WalletIcon, label: "Eco Wallet", to: "/app/wallet" },
    { icon: ShoppingBag, label: "Marketplace", to: "/app/marketplace" },
    { icon: Calculator, label: "Eco Simulator", to: "/app/simulator" },
    { icon: Ticket, label: "Mis cupones", to: "/app/coupons" },
    { icon: Trophy, label: "Comunidad", to: "/app/community" },
    { icon: Bell, label: "Notificaciones", to: "/app/notifications" },
    { icon: Shield, label: "Privacidad y seguridad", to: "#" },
    { icon: Settings, label: "Configuración", to: "#" },
    { icon: HelpCircle, label: "Ayuda y soporte", to: "#" },
  ];

  return (
    <MobileShell>
      <header className="relative overflow-hidden rounded-b-[32px] bg-gradient-hero px-5 pb-8 pt-[max(env(safe-area-inset-top),20px)] text-primary-foreground">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <h1 className="font-display text-xl font-extrabold">Mi perfil</h1>
          <button
            onClick={() => setEditing((e) => !e)}
            className="flex h-10 items-center gap-1.5 rounded-full bg-white/15 px-3 backdrop-blur"
          >
            <Pencil className="h-4 w-4" /> <span className="text-xs font-bold">{editing ? "Guardar" : "Editar"}</span>
          </button>
        </div>

        <div className="relative mt-5 flex items-center gap-4">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 font-display text-3xl font-extrabold backdrop-blur ring-4 ring-white/20">
              {USER.avatar}
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-accent text-base shadow-card">
              {title.emoji}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-xl font-extrabold">{USER.name}</p>
            <p className="text-sm text-primary-foreground/80">{USER.username}</p>
            <div className={`mt-1.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${title.color} px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider`}>
              {title.title}
            </div>
            <p className="mt-1 text-[11px] text-primary-foreground/75">{USER.university} · {USER.career}</p>
          </div>
        </div>

        <div className="relative mt-5 rounded-2xl bg-white/15 p-4 backdrop-blur">
          <div className="flex justify-between text-xs font-semibold">
            <span>🌿 {USER.level}</span>
            <span>{USER.points} / {USER.nextLevelAt} pts</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
            <div className="h-full rounded-full bg-gradient-to-r from-accent to-white" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-primary-foreground/80">
            Te faltan <strong>{USER.nextLevelAt - USER.points} pts</strong> para ser <strong>{USER.nextLevel}</strong>
          </p>
        </div>
      </header>

      <section className="px-5 pt-5">
        <div className="rounded-3xl bg-card p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-display text-sm font-bold">Badges desbloqueados</p>
            <Link to="/app/community" className="text-xs font-semibold text-primary">Ver todos →</Link>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {unlockedBadges.map((b) => (
              <div key={b.id} className="flex w-20 flex-none flex-col items-center rounded-2xl bg-muted/40 p-2 text-center">
                <span className="text-2xl">{b.emoji}</span>
                <p className="mt-1 line-clamp-1 text-[10px] font-bold">{b.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pt-5 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-card p-3 text-center shadow-soft">
          <p className="font-display text-xl font-extrabold text-primary">{USER.totalKg}<span className="text-xs">kg</span></p>
          <p className="text-[11px] text-muted-foreground">Reciclados</p>
        </div>
        <div className="rounded-2xl bg-card p-3 text-center shadow-soft">
          <p className="font-display text-xl font-extrabold text-secondary">{USER.co2Saved}<span className="text-xs">kg</span></p>
          <p className="text-[11px] text-muted-foreground">CO₂ ahorrado</p>
        </div>
        <div className="rounded-2xl bg-card p-3 text-center shadow-soft">
          <p className="font-display text-xl font-extrabold text-accent-foreground">{USER.streak}🔥</p>
          <p className="text-[11px] text-muted-foreground">Racha</p>
        </div>
      </section>

      {/* Impact summary module */}
      <section className="px-5 pt-5">
        <div className="overflow-hidden rounded-3xl bg-card shadow-soft">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Leaf className="h-4 w-4" />
              </span>
              <p className="font-display text-sm font-bold">Tu impacto</p>
            </div>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">#{USER.levelIndex + 1} ranking</span>
          </div>
          <div className="grid grid-cols-3 gap-2 px-5 py-4">
            <MiniImpact icon={<Wind className="h-4 w-4" />} value={`${IMPACT.co2Kg}`} unit="kg" label="CO₂ evitado" />
            <MiniImpact icon={<TreePine className="h-4 w-4" />} value={`${IMPACT.treesSaved}`} unit="" label="árboles/año" />
            <MiniImpact icon={<Droplets className="h-4 w-4" />} value={`${IMPACT.waterLiters}`} unit="L" label="agua" />
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

      {editing && (
        <section className="mx-5 mt-5 space-y-3 rounded-3xl bg-card p-5 shadow-soft animate-slide-up">
          <p className="font-display text-base font-bold">Editar datos</p>
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input defaultValue={USER.name} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Correo</Label>
            <Input defaultValue={USER.email} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Universidad / carrera</Label>
            <Input defaultValue={USER.university} className="h-11 rounded-xl" />
          </div>
          <Button
            onClick={() => { toast.success("Perfil actualizado"); setEditing(false); }}
            className="h-11 w-full rounded-xl bg-gradient-primary font-bold"
          >
            Guardar cambios
          </Button>
        </section>
      )}

      <section className="mx-5 mt-5 rounded-3xl bg-card p-5 shadow-soft">
        <p className="mb-3 font-display text-base font-bold">Historial reciente</p>
        <div className="space-y-2">
          {ACTIVITY.map((a) => {
            const m = MATERIALS[a.material];
            const c = CENTERS.find((x) => x.id === a.centerId);
            return (
              <div key={a.id} className="flex items-center gap-3 rounded-2xl bg-muted/40 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card text-xl">{m.emoji}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{m.label} · {a.kg} kg</p>
                  <p className="truncate text-[11px] text-muted-foreground">{c?.name} · {a.date}</p>
                </div>
                <span className="text-sm font-bold text-primary">+{a.points}</span>
              </div>
            );
          })}
        </div>
      </section>

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

      <div className="px-5 py-5">
        <Button
          variant="outline"
          onClick={() => { toast("Sesión cerrada"); nav("/"); }}
          className="h-12 w-full rounded-2xl border-2 border-destructive/30 text-destructive hover:bg-destructive/5"
        >
          <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
        </Button>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">RECIPE v1.0 · MVP demo</p>
      </div>
    </MobileShell>
  );
};

const MiniImpact = ({ icon, value, unit, label }: { icon: React.ReactNode; value: string; unit: string; label: string }) => (
  <div className="rounded-2xl bg-muted/40 p-3">
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-card text-primary">{icon}</span>
    <p className="mt-2 font-display text-base font-extrabold leading-none">{value}<span className="ml-0.5 text-[10px] font-bold">{unit}</span></p>
    <p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p>
  </div>
);

export default Profile;
