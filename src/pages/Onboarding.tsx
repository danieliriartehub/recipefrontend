import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileShell } from "@/components/recipe/MobileShell";
import { Logo } from "@/components/recipe/Logo";
import { Button } from "@/components/ui/button";
import { MapPin, QrCode, Gift, TreePine } from "lucide-react";

const STEPS = [
  {
    icon: MapPin,
    title: "Encuentra puntos cercanos",
    body: "Mapa inteligente con estados en tiempo real: abierto, lleno, mantenimiento o campañas móviles.",
    tint: "from-primary to-primaryGlow",
  },
  {
    icon: QrCode,
    title: "Valida con tu QR",
    body: "Muestra tu QR personal al operador y suma EcoPuntos automáticamente. Sin papel, sin filas.",
    tint: "from-secondary to-primary",
  },
  {
    icon: TreePine,
    title: "Ve tu impacto real",
    body: "Cada kilo equivale a árboles, agua y CO₂. Compite con tu universidad y sube de nivel.",
    tint: "from-accent to-primaryGlow",
  },
  {
    icon: Gift,
    title: "Canjea recompensas",
    body: "Cafés, transporte, cursos y más. Beneficios pensados para universitarios de Lima.",
    tint: "from-primaryGlow to-accent",
  },
];

const Onboarding = () => {
  const [i, setI] = useState(0);
  const nav = useNavigate();
  const step = STEPS[i];
  const Icon = step.icon;
  const last = i === STEPS.length - 1;

  return (
    <MobileShell hideNav>
      <div className="relative flex min-h-screen flex-col bg-gradient-soft px-6 pt-[max(env(safe-area-inset-top),20px)]">
        <div className="flex items-center justify-between">
          <Logo />
          <button onClick={() => nav("/auth")} className="text-xs font-semibold text-muted-foreground">Saltar</button>
        </div>

        <div className="mt-12 flex flex-1 flex-col items-center text-center">
          <div className={`flex h-44 w-44 items-center justify-center rounded-[40px] bg-gradient-to-br ${step.tint} text-primary-foreground shadow-float animate-scale-in`}>
            <Icon className="h-20 w-20" strokeWidth={1.8} />
          </div>

          <div key={i} className="mt-10 max-w-xs animate-slide-up">
            <h1 className="font-display text-3xl font-extrabold leading-tight">{step.title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">{step.body}</p>
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 pt-4">
          {STEPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className={`h-2 rounded-full transition-smooth ${
                idx === i ? "w-7 bg-primary" : "w-2 bg-muted-foreground/30"
              }`}
              aria-label={`Paso ${idx + 1}`}
            />
          ))}
        </div>

        <div className="space-y-3 pb-[max(env(safe-area-inset-bottom),24px)] pt-6">
          <Button
            size="lg"
            onClick={() => (last ? nav("/auth") : setI((v) => v + 1))}
            className="h-14 w-full rounded-2xl bg-gradient-primary text-base font-bold shadow-glow"
          >
            {last ? "Empezar a reciclar" : "Siguiente"}
          </Button>
          {!last && (
            <Button variant="ghost" onClick={() => nav("/auth")} className="h-12 w-full rounded-2xl text-muted-foreground">
              Ya tengo cuenta
            </Button>
          )}
        </div>
      </div>
    </MobileShell>
  );
};

export default Onboarding;
