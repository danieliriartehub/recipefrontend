import { useState } from "react";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { useAuth } from "@/lib/auth";
import { MATERIALS, ACTIVITY, WEEKLY_KG, WEEK_LABELS, MONTHLY_KG, MONTH_LABELS, MILESTONES } from "@/data/mock";
import { Share2, TreePine, Droplets, Zap, Car, Wind, Trophy, Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

type Period = "semanal" | "mensual";

const Impact = () => {
  const { profile } = useAuth();

  // Datos reales del perfil
  const totalKg   = profile?.total_kg     ?? 0;
  const co2Saved  = profile?.co2_saved_kg ?? 0;
  const levelIndex = profile?.level_index ?? 0;
  const levelNames = ["Semilla", "Brote", "Sembrador", "Eco Warrior", "Guardián Verde", "Leyenda Eco"];
  const levelName = levelNames[levelIndex] ?? "Semilla";

  // Equivalencias calculadas desde datos reales
  const impact = {
    co2Kg:        co2Saved,
    treesSaved:   +(co2Saved / 21).toFixed(2),
    waterLiters:  Math.round(totalKg * 18),
    energyKwh:    +(totalKg * 1.4).toFixed(1),
    showerMin:    Math.round(totalKg * 18 / 9),
    kmCarAvoided: +(co2Saved * 5.7).toFixed(1),
  };

  const [period, setPeriod] = useState<Period>("semanal");
  const series = period === "mensual" ? MONTHLY_KG : WEEKLY_KG;
  const labels = period === "mensual" ? MONTH_LABELS : WEEK_LABELS;
  const maxV = Math.max(...series, 1);

  // breakdown por material a partir del historial (mock hasta tener recyclings reales)
  const breakdown = (Object.keys(MATERIALS) as Array<keyof typeof MATERIALS>).map((m) => {
    const total = ACTIVITY.filter((a) => a.material === m).reduce((s, a) => s + a.kg, 0);
    return { material: m, kg: +total.toFixed(1) };
  }).filter((b) => b.kg > 0);
  const breakdownTotal = breakdown.reduce((s, b) => s + b.kg, 0) || 1;

  return (
    <MobileShell>
      <ScreenHeader title="Tu impacto" subtitle="Lo que estás cambiando en Lima" showBell />

      <div className="px-5 space-y-5 pb-4">
        {/* Hero CO2 */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-card">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <p className="text-xs uppercase tracking-wider opacity-80">CO₂ evitado</p>
          <div className="flex items-end gap-2">
            <p className="font-display text-[56px] font-extrabold leading-none">{impact.co2Kg}</p>
            <p className="mb-2 font-display text-xl font-bold opacity-90">kg</p>
          </div>
          <p className="mt-2 text-sm opacity-90">
            Equivale a <strong>{impact.kmCarAvoided} km</strong> sin manejar un auto 🚗
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/15 p-3 text-center backdrop-blur">
              <p className="font-display text-xl font-extrabold">{totalKg}</p>
              <p className="text-[10px] opacity-85">kg reciclados</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-3 text-center backdrop-blur">
              <p className="font-display text-xl font-extrabold">{impact.treesSaved}</p>
              <p className="text-[10px] opacity-85">árboles/año</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-3 text-center backdrop-blur">
              <p className="font-display text-xl font-extrabold">#{levelIndex + 1}</p>
              <p className="text-[10px] opacity-85">{levelName}</p>
            </div>
          </div>
        </div>

        {/* Period selector + chart */}
        <div className="rounded-3xl bg-card p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-base font-bold">Tu evolución</h3>
            <div className="grid grid-cols-2 rounded-full bg-muted p-0.5 text-[11px] font-bold">
              {(["semanal", "mensual"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-full px-3 py-1 transition-smooth ${period === p ? "bg-background shadow-soft text-primary" : "text-muted-foreground"}`}
                >
                  {p === "semanal" ? "Semana" : "Mes"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex h-32 items-end justify-between gap-2">
            {series.map((v, i) => {
              const h = Math.max(6, (v / maxV) * 100);
              const isLast = i === series.length - 1;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground">{v > 0 ? v : ""}</span>
                  <div
                    className={`w-full rounded-t-lg ${v === 0 ? "bg-muted" : isLast ? "bg-gradient-primary shadow-glow" : "bg-primary/40"}`}
                    style={{ height: `${h}%` }}
                  />
                  <span className={`text-[10px] ${isLast ? "font-bold text-primary" : "text-muted-foreground"}`}>{labels[i]}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            {period === "semanal"
              ? `Meta semanal: ${profile?.weekly_goal_kg ?? 5} kg`
              : `Últimos 6 meses · ${series.reduce((s, v) => s + v, 0).toFixed(1)} kg totales`}
          </p>
        </div>

        {/* Milestones */}
        <div className="rounded-3xl bg-card p-5 shadow-soft">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-bold">Milestones ecológicos</h3>
          </div>
          <div className="space-y-3">
            {MILESTONES.map((m) => {
              const pct = Math.min(100, Math.round((totalKg / m.target) * 100));
              return (
                <div key={m.id} className={`rounded-2xl p-3 transition-smooth ${m.unlocked ? "bg-success/8" : "bg-muted/40"}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl ${!m.unlocked && "grayscale opacity-50"}`}>{m.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">{m.label}</p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background">
                        <div className={`h-full rounded-full ${m.unlocked ? "bg-success" : "bg-gradient-primary"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    {m.unlocked ? (
                      <span className="rounded-full bg-success px-2 py-0.5 text-[10px] font-extrabold text-success-foreground">✓</span>
                    ) : (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Equivalences */}
        <div>
          <h3 className="mb-3 font-display text-base font-bold">Equivalencias ecológicas</h3>
          <div className="grid grid-cols-2 gap-3">
            <EqCard icon={TreePine} label="Árboles salvados" value={`${impact.treesSaved}`} unit="árb/año" tint="bg-primary/10 text-primary" />
            <EqCard icon={Droplets} label="Agua ahorrada" value={`${impact.waterLiters}`} unit="litros" tint="bg-secondary/10 text-secondary" />
            <EqCard icon={Zap} label="Energía" value={`${impact.energyKwh}`} unit="kWh" tint="bg-accent/20 text-accent-foreground" />
            <EqCard icon={Car} label="Auto evitado" value={`${impact.kmCarAvoided}`} unit="km" tint="bg-material-glass/15 text-material-glass" />
            <EqCard icon={Wind} label="Duchas" value={`${impact.showerMin}`} unit="min" tint="bg-material-plastic/15 text-material-plastic" />
            <EqCard icon={Trophy} label="Top universidad" value="#2" unit="ranking" tint="bg-material-paper/15 text-material-paper" />
          </div>
        </div>

        {/* Material breakdown */}
        <div className="rounded-3xl bg-card p-5 shadow-soft">
          <h3 className="mb-3 font-display text-base font-bold">¿Qué reciclas más?</h3>
          <div className="space-y-3">
            {breakdown.map((b) => {
              const m = MATERIALS[b.material];
              const pct = Math.round((b.kg / breakdownTotal) * 100);
              return (
                <div key={b.material}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-semibold"><span>{m.emoji}</span>{m.label}</span>
                    <span className="text-muted-foreground">{b.kg} kg · {pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${m.bgClass}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Button size="lg" className="h-13 w-full rounded-2xl bg-gradient-primary font-semibold shadow-glow">
          <Share2 className="mr-2 h-4 w-4" /> Compartir mi impacto
        </Button>
      </div>
    </MobileShell>
  );
};

const EqCard = ({
  icon: Icon, label, value, unit, tint,
}: { icon: any; label: string; value: string; unit: string; tint: string }) => (
  <div className="rounded-2xl bg-card p-4 shadow-soft">
    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint}`}>
      <Icon className="h-5 w-5" />
    </span>
    <p className="mt-3 font-display text-2xl font-extrabold leading-none">{value}</p>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{unit}</p>
    <p className="mt-1 text-xs font-medium">{label}</p>
  </div>
);

export default Impact;
