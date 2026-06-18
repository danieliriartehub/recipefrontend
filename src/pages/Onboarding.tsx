import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MobileShell } from "@/components/recipe/MobileShell";
import { Logo } from "@/components/recipe/Logo";
import { Button } from "@/components/ui/button";
import onboardingMapImg from "@/assets/onboarding-map.png";
import onboardingQrImg from "@/assets/onboarding-qr.png";
import onboardingRewardsImg from "@/assets/onboarding-rewards.png";

const STEPS = [
  {
    image: onboardingMapImg,
    title: "Encuentra puntos cercanos",
    body: "Mapa inteligente con estados en tiempo real: abierto, lleno, mantenimiento o campañas móviles.",
  },
  {
    image: onboardingQrImg,
    title: "Valida con tu QR",
    body: "Muestra tu QR personal al operador y suma EcoPuntos automáticamente. Sin papel, sin filas.",
  },
  {
    image: onboardingRewardsImg,
    title: "Canjea recompensas",
    body: "Cafés, transporte, cursos y más.",
  },
];

const Onboarding = () => {
  const [i, setI] = useState(0);
  const nav = useNavigate();
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  return (
    <MobileShell hideNav>
      <div className="relative flex min-h-screen flex-col bg-gradient-soft px-6 pt-[max(env(safe-area-inset-top),20px)]">
        <div className="flex items-center justify-between">
          <Logo />
          <button onClick={() => nav("/auth")} className="text-xs font-semibold text-muted-foreground">Saltar</button>
        </div>

        <div className="mt-12 flex flex-1 flex-col items-center text-center">
          <div className="animate-scale-in">
            <img
              src={step.image}
              alt={step.title}
              className="h-52 w-52 rounded-[40px] object-cover shadow-float"
            />
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
              className={`h-2 rounded-full transition-smooth ${idx === i ? "w-7 bg-primary" : "w-2 bg-muted-foreground/30"
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
