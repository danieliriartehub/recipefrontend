import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { useAuth } from "@/lib/auth";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Wind, TreePine, Minus, Plus, Loader2, AlertCircle } from "lucide-react";
import { backendApi } from "@/lib/backendApi";

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface SimMaterial {
  type: string;
  label: string;
  emoji: string;
  points_per_kg: number;
  co2_per_kg: number;
  trees_equivalent_per_kg: number;
}

// ─── Componente principal ─────────────────────────────────────────────────────

const Simulator = () => {
  const { profile } = useAuth();
  const currentPoints = profile?.points ?? 0;

  const [materials, setMaterials] = useState<SimMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [kg, setKg] = useState<number>(0);

  // ── Cargar materiales desde el backend ──────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);
    backendApi
      .get<SimMaterial[]>("/api/v1/simulator/materials")
      .then((data) => {
        setMaterials(data);
        if (data.length > 0) setSelectedType(data[0].type);
      })
      .catch((err: Error) => {
        setError(err.message ?? "Error al cargar materiales");
      })
      .finally(() => setLoading(false));
  }, []);

  const material = materials.find((m) => m.type === selectedType) ?? null;

  const points = useMemo(
    () => (material ? Math.round(kg * material.points_per_kg) : 0),
    [kg, material]
  );
  const co2 = material ? +(kg * Number(material.co2_per_kg)).toFixed(2) : 0;
  const trees = material
    ? +(kg * Number(material.trees_equivalent_per_kg)).toFixed(3)
    : 0;
  const totalAfter = currentPoints + points;

  const setKgSafe = (n: number) =>
    setKg(Math.max(0, Math.min(20, +n.toFixed(1))));

  // ── Estados de carga / error ─────────────────────────────────────────────────
  if (loading) {
    return (
      <MobileShell>
        <ScreenHeader title="Eco Simulator" subtitle="Calcula tu impacto antes de reciclar" back />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">Cargando materiales…</p>
        </div>
      </MobileShell>
    );
  }

  if (error) {
    return (
      <MobileShell>
        <ScreenHeader title="Eco Simulator" subtitle="Calcula tu impacto antes de reciclar" back />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-16 text-destructive">
          <AlertCircle className="h-8 w-8" />
          <p className="text-center text-sm font-semibold">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              setError(null);
              backendApi
                .get<SimMaterial[]>("/api/v1/simulator/materials")
                .then((data) => {
                  setMaterials(data);
                  if (data.length > 0) setSelectedType(data[0].type);
                })
                .catch((err: Error) => setError(err.message ?? "Error al cargar materiales"))
                .finally(() => setLoading(false));
            }}
          >
            Reintentar
          </Button>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <ScreenHeader title="Eco Simulator" subtitle="Calcula tu impacto antes de reciclar" back />

      <div className="px-5 space-y-5 pb-4">
        {/* Material selector */}
        <div className="rounded-3xl bg-card p-5 shadow-soft">
          <p className="text-sm font-semibold">1. Elige el material</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {materials.map((m) => {
              const active = selectedType === m.type;
              return (
                <button
                  key={m.type}
                  onClick={() => setSelectedType(m.type)}
                  className={`rounded-2xl border-2 p-3 text-center transition-bounce ${
                    active
                      ? "border-primary bg-primary/5 shadow-soft scale-[1.02]"
                      : "border-border bg-card"
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <p className="mt-1 font-display text-[11px] font-extrabold leading-tight">
                    {m.label}
                  </p>
                  <p className="text-[10px] font-bold text-primary">
                    {m.points_per_kg} pts/kg
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Weight input */}
        <div className="rounded-3xl bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">2. ¿Cuántos kg?</p>
            <span className="font-display text-2xl font-extrabold text-primary">
              {kg.toFixed(1)} kg
            </span>
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
              min={0}
              max={20}
              onChange={(e) => setKgSafe(Number(e.target.value) || 0)}
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
            min={0}
            max={10}
            step={0.1}
            onValueChange={(v) => setKg(v[0])}
            className="mt-5"
          />
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
            <span>0 kg</span>
            <span>5 kg</span>
            <span>10 kg</span>
          </div>
        </div>

        {/* Points result */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-glow animate-scale-in">
          <Sparkles className="absolute right-4 top-4 h-6 w-6 opacity-60" />
          <p className="text-xs uppercase tracking-wider opacity-80">Ganarías</p>
          <p className="font-display text-5xl font-extrabold leading-none">
            +{points}
          </p>
          <p className="mt-1 text-sm opacity-90">
            EcoPuntos por reciclar {kg.toFixed(1)} kg de{" "}
            {material?.label.toLowerCase() ?? "—"}
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/15 p-3 text-sm backdrop-blur">
            <TrendingUp className="h-4 w-4" />
            Nuevo total:{" "}
            <strong className="ml-1">{totalAfter.toLocaleString()} pts</strong>
          </div>
        </div>

        {/* Impact equivalencies */}
        <div className="space-y-3">
          <p className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Tu impacto ambiental
          </p>
          <div className="grid grid-cols-2 gap-3">
            <ImpactCell
              icon={<Wind className="h-5 w-5" />}
              value={co2}
              unit="kg"
              label="CO₂ evitado"
              tint="bg-primary/10 text-primary"
            />
            <ImpactCell
              icon={<TreePine className="h-5 w-5" />}
              value={trees}
              unit="árb."
              label="Árboles equiv."
              tint="bg-green-500/15 text-green-600 dark:text-green-400"
            />
          </div>
        </div>

        <Button
          asChild
          size="lg"
          className="mb-2 h-14 w-full rounded-2xl bg-gradient-primary text-base font-bold shadow-glow"
        >
          <Link to="/app/map">Buscar centro cercano</Link>
        </Button>
      </div>
    </MobileShell>
  );
};

const ImpactCell = ({
  icon,
  value,
  unit,
  label,
  tint,
}: {
  icon: React.ReactNode;
  value: number;
  unit: string;
  label: string;
  tint: string;
}) => (
  <div className="rounded-2xl bg-card p-4 shadow-soft transition-bounce hover:-translate-y-0.5">
    <span
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${tint}`}
    >
      {icon}
    </span>
    <p className="mt-2 font-display text-2xl font-extrabold leading-none">
      {value}
      <span className="ml-0.5 text-[11px] font-bold">{unit}</span>
    </p>
    <p className="mt-0.5 text-[11px] text-muted-foreground">{label}</p>
  </div>
);

export default Simulator;
