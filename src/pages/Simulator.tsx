import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { USER } from "@/data/mock";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Droplets, Zap, Wind, Minus, Plus } from "lucide-react";

type SimMaterial = "plastico" | "carton" | "vidrio" | "aluminio" | "electronicos" | "papel";

const SIM_MATERIALS: Record<SimMaterial, {
  label: string; emoji: string; pointsPerKg: number; co2PerKg: number; waterPerKg: number; energyPerKg: number;
}> = {
  plastico:      { label: "Plástico",     emoji: "🧴", pointsPerKg: 50, co2PerKg: 1.5, waterPerKg: 18,  energyPerKg: 1.4 },
  carton:        { label: "Cartón",       emoji: "📦", pointsPerKg: 35, co2PerKg: 1.0, waterPerKg: 26,  energyPerKg: 1.1 },
  vidrio:        { label: "Vidrio",       emoji: "🍾", pointsPerKg: 40, co2PerKg: 0.3, waterPerKg: 8,   energyPerKg: 0.6 },
  aluminio:      { label: "Aluminio",     emoji: "🥫", pointsPerKg: 80, co2PerKg: 9.0, waterPerKg: 40,  energyPerKg: 14  },
  electronicos:  { label: "Electrónicos", emoji: "💻", pointsPerKg: 120,co2PerKg: 12,  waterPerKg: 55,  energyPerKg: 22  },
  papel:         { label: "Papel",        emoji: "📄", pointsPerKg: 30, co2PerKg: 1.1, waterPerKg: 22,  energyPerKg: 1.0 },
};

const Simulator = () => {
  const [material, setMaterial] = useState<SimMaterial>("plastico");
  const [kg, setKg] = useState<number>(1);

  const data = SIM_MATERIALS[material];
  const points = useMemo(() => Math.round(kg * data.pointsPerKg), [kg, data]);
  const co2 = +(kg * data.co2PerKg).toFixed(2);
  const water = Math.round(kg * data.waterPerKg);
  const energy = +(kg * data.energyPerKg).toFixed(1);
  const totalAfter = USER.points + points;

  const setKgSafe = (n: number) => setKg(Math.max(0.1, Math.min(20, +n.toFixed(1))));

  return (
    <MobileShell>
      <ScreenHeader title="Eco Simulator" subtitle="Calcula tu impacto antes de reciclar" back />

      <div className="px-5 space-y-5 pb-4">
        {/* Material selector */}
        <div className="rounded-3xl bg-card p-5 shadow-soft">
          <p className="text-sm font-semibold">1. Elige el material</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(Object.keys(SIM_MATERIALS) as SimMaterial[]).map((m) => {
              const active = material === m;
              const item = SIM_MATERIALS[m];
              return (
                <button
                  key={m}
                  onClick={() => setMaterial(m)}
                  className={`rounded-2xl border-2 p-3 text-center transition-bounce ${
                    active ? "border-primary bg-primary/5 shadow-soft scale-[1.02]" : "border-border bg-card"
                  }`}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <p className="mt-1 font-display text-[11px] font-extrabold leading-tight">{item.label}</p>
                  <p className="text-[10px] font-bold text-primary">{item.pointsPerKg}pts/kg</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Weight input with stepper + slider */}
        <div className="rounded-3xl bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">2. ¿Cuántos kg?</p>
            <span className="font-display text-2xl font-extrabold text-primary">{kg.toFixed(1)} kg</span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => setKgSafe(kg - 0.5)}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted transition-bounce hover:bg-muted/70 active:scale-95"
              aria-label="Reducir"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              type="number"
              value={kg}
              step={0.1}
              min={0.1}
              max={20}
              onChange={(e) => setKgSafe(Number(e.target.value) || 0.1)}
              className="h-11 flex-1 rounded-xl border border-border bg-background text-center font-display text-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <button
              onClick={() => setKgSafe(kg + 0.5)}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-bounce hover:opacity-90 active:scale-95"
              aria-label="Aumentar"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <Slider
            value={[kg]}
            min={0.1}
            max={10}
            step={0.1}
            onValueChange={(v) => setKg(v[0])}
            className="mt-5"
          />
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span>0.1 kg</span><span>5 kg</span><span>10 kg</span>
          </div>
        </div>

        {/* Points result */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-glow animate-scale-in">
          <Sparkles className="absolute right-4 top-4 h-6 w-6 opacity-60" />
          <p className="text-xs uppercase tracking-wider opacity-80">Ganarías</p>
          <p className="font-display text-5xl font-extrabold leading-none">+{points}</p>
          <p className="mt-1 text-sm opacity-90">EcoPuntos por reciclar {kg.toFixed(1)} kg de {data.label.toLowerCase()}</p>

          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/15 p-3 text-sm backdrop-blur">
            <TrendingUp className="h-4 w-4" />
            Nuevo total: <strong className="ml-1">{totalAfter.toLocaleString()} pts</strong>
          </div>
        </div>

        {/* Impact equivalencies */}
        <div className="space-y-3">
          <p className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tu impacto ambiental</p>
          <div className="grid grid-cols-3 gap-2">
            <ImpactCell icon={<Wind className="h-5 w-5" />} value={co2} unit="kg" label="CO₂ evitado" tint="bg-primary/10 text-primary" />
            <ImpactCell icon={<Droplets className="h-5 w-5" />} value={water} unit="L" label="Agua preservada" tint="bg-secondary/15 text-secondary" />
            <ImpactCell icon={<Zap className="h-5 w-5" />} value={energy} unit="kWh" label="Energía" tint="bg-accent/20 text-accent-foreground" />
          </div>
        </div>

        <Button asChild size="lg" className="mb-2 h-14 w-full rounded-2xl bg-gradient-primary text-base font-bold shadow-glow">
          <Link to="/app/map">Buscar centro cercano</Link>
        </Button>
      </div>
    </MobileShell>
  );
};

const ImpactCell = ({ icon, value, unit, label, tint }: { icon: React.ReactNode; value: number; unit: string; label: string; tint: string }) => (
  <div className="rounded-2xl bg-card p-3 shadow-soft transition-bounce hover:-translate-y-0.5">
    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${tint}`}>{icon}</span>
    <p className="mt-2 font-display text-lg font-extrabold leading-none">{value}<span className="ml-0.5 text-[11px] font-bold">{unit}</span></p>
    <p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p>
  </div>
);

export default Simulator;
