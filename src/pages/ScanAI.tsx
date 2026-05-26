import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { SCAN_SAMPLES, MATERIALS, CENTERS, type ScanResult } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Camera, Sparkles, Check, X, MapPin, Zap, RefreshCw, ImagePlus } from "lucide-react";

type Phase = "idle" | "scanning" | "result";

const ScanAI = () => {
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    if (phase !== "scanning") return;
    const t = setTimeout(() => {
      const r = SCAN_SAMPLES[Math.floor(Math.random() * SCAN_SAMPLES.length)];
      setResult(r);
      setPhase("result");
    }, 2200);
    return () => clearTimeout(t);
  }, [phase]);

  const reset = () => { setPhase("idle"); setResult(null); };

  return (
    <MobileShell>
      <ScreenHeader title="RecycleScan AI" subtitle="Apunta tu residuo y deja que la IA decida" back />

      <div className="px-5">
        {/* Camera viewport */}
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-700 shadow-float">
          {/* Fake camera feed */}
          <div className="absolute inset-0 opacity-70">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,hsl(150_50%_40%/0.3),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,hsl(200_60%_40%/0.25),transparent_60%)]" />
          </div>

          {/* AI grid overlay */}
          <svg className="absolute inset-0 h-full w-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="scangrid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="hsl(145 75% 65%)" strokeWidth="0.2" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#scangrid)" />
          </svg>

          {/* Frame brackets */}
          <div className="absolute inset-8">
            {[
              "left-0 top-0 border-l-4 border-t-4",
              "right-0 top-0 border-r-4 border-t-4",
              "left-0 bottom-0 border-l-4 border-b-4",
              "right-0 bottom-0 border-r-4 border-b-4",
            ].map((cls, i) => (
              <span key={i} className={`absolute h-10 w-10 rounded-md border-primary-foreground/90 ${cls}`} />
            ))}

            {/* Scan line */}
            {phase === "scanning" && (
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-glow to-transparent shadow-glow animate-scan-line" />
              </div>
            )}
          </div>

          {/* Center hint or detected item */}
          <div className="absolute inset-x-0 bottom-0 p-5">
            {phase === "idle" && (
              <div className="glass-dark rounded-2xl p-4 text-primary-foreground">
                <p className="text-xs font-bold uppercase tracking-wider opacity-80">IA Reciclaje</p>
                <p className="mt-1 text-sm">Coloca el residuo dentro del marco y toca el botón.</p>
              </div>
            )}
            {phase === "scanning" && (
              <div className="glass-dark rounded-2xl p-4 text-primary-foreground animate-slide-up">
                <p className="flex items-center gap-2 text-sm font-bold">
                  <Sparkles className="h-4 w-4 animate-pulse" /> Analizando material…
                </p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-primary-glow to-accent" />
                </div>
              </div>
            )}
            {phase === "result" && result && (
              <div className="glass-dark animate-scale-in rounded-2xl p-4 text-primary-foreground">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{MATERIALS[result.material].emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold">{result.itemName}</p>
                    <p className="text-xs opacity-85">Confianza {result.confidence}%</p>
                  </div>
                  {result.recyclable ? (
                    <span className="flex items-center gap-1 rounded-full bg-success/90 px-2 py-1 text-[10px] font-bold">
                      <Check className="h-3 w-3" /> Reciclable
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-destructive/90 px-2 py-1 text-[10px] font-bold">
                      <X className="h-3 w-3" /> No reciclable
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {phase === "idle" && (
          <div className="mt-5 space-y-3">
            <Button
              size="lg"
              onClick={() => setPhase("scanning")}
              className="h-14 w-full rounded-2xl bg-gradient-primary text-base font-bold shadow-glow"
            >
              <Camera className="mr-2 h-5 w-5" /> Escanear ahora
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setPhase("scanning")}
              className="h-12 w-full rounded-2xl border-2 font-semibold"
            >
              <ImagePlus className="mr-2 h-4 w-4" /> Subir desde galería
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Plástico, papel, vidrio, aluminio · más de 200 tipos identificados
            </p>
          </div>
        )}

        {phase === "result" && result && (
          <div className="mt-5 space-y-3 animate-slide-up">
            <div className="rounded-3xl bg-card p-5 shadow-card">
              <div className="flex items-start gap-3">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${MATERIALS[result.material].bgClass}/15`}>
                  {MATERIALS[result.material].emoji}
                </span>
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {MATERIALS[result.material].label}
                  </p>
                  <p className="font-display text-lg font-extrabold">{result.itemName}</p>
                </div>
                {result.recyclable && (
                  <div className="text-right">
                    <p className="font-display text-2xl font-extrabold text-primary">+{result.estimatedPoints}</p>
                    <p className="text-[10px] text-muted-foreground">pts est.</p>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-2xl bg-accent/15 p-3 text-xs">
                <Sparkles className="mt-0.5 h-4 w-4 flex-none text-accent-foreground" />
                <p className="text-accent-foreground"><strong>Tip IA:</strong> {result.tip}</p>
              </div>
            </div>

            {result.recyclable && (
              <Link
                to={`/app/center/${result.nearestCenterId}`}
                className="flex items-center gap-4 rounded-3xl bg-gradient-hero p-4 text-primary-foreground shadow-card transition-bounce hover:-translate-y-0.5"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                  <MapPin className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs opacity-80">Centro más cercano</p>
                  <p className="truncate font-display text-base font-extrabold">
                    {CENTERS.find((c) => c.id === result.nearestCenterId)?.name}
                  </p>
                  <p className="text-xs opacity-85">
                    {CENTERS.find((c) => c.id === result.nearestCenterId)?.distanceKm} km ·
                    {" "}{CENTERS.find((c) => c.id === result.nearestCenterId)?.etaMin} min a pie
                  </p>
                </div>
                <Zap className="h-5 w-5" />
              </Link>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={reset} className="h-12 rounded-2xl border-2 font-semibold">
                <RefreshCw className="mr-2 h-4 w-4" /> Escanear otro
              </Button>
              <Link
                to="/app/qr"
                className="flex h-12 items-center justify-center rounded-2xl bg-gradient-primary font-bold text-primary-foreground shadow-glow"
              >
                Llevar al centro →
              </Link>
            </div>
          </div>
        )}

        {phase === "scanning" && (
          <p className="mt-5 text-center text-sm font-semibold text-primary animate-pulse">
            La IA está identificando el material…
          </p>
        )}
      </div>
    </MobileShell>
  );
};

export default ScanAI;
