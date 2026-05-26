import { Link } from "react-router-dom";
import { Logo } from "@/components/recipe/Logo";
import { Button } from "@/components/ui/button";
import { MobileShell } from "@/components/recipe/MobileShell";
import { MapPin, Trophy, TreePine, Sparkles } from "lucide-react";
import heroImg from "@/assets/welcome-hero.jpg";

const features = [
  { icon: MapPin, label: "Mapa inteligente" },
  { icon: TreePine, label: "Impacto real" },
  { icon: Trophy, label: "Comunidad" },
];

const Welcome = () => {
  return (
    <MobileShell hideNav>
      <div className="relative flex min-h-screen flex-col bg-gradient-hero text-primary-foreground overflow-hidden">
        <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />

        <div className="relative z-10 flex flex-1 flex-col px-6 pt-[max(env(safe-area-inset-top),32px)]">
          <Logo light />

          <div className="mt-6 flex justify-center animate-float-slow">
            <img
              src={heroImg}
              alt="Estudiantes universitarios reciclando"
              width={1024}
              height={1280}
              className="h-60 w-60 rounded-3xl object-cover shadow-float"
            />
          </div>

          <div className="mt-8 animate-slide-up">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Plataforma universitaria · Lima
            </span>
            <h1 className="mt-3 font-display text-[34px] font-extrabold leading-tight">
              Recicla inteligente. <span className="text-accent">Mide</span> tu impacto. Compite con tu uni.
            </h1>
            <p className="mt-3 text-base text-primary-foreground/85">
              Más que puntos: una comunidad universitaria con datos reales de CO₂, retos y recompensas.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {features.map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-2xl bg-white/12 p-3 text-center backdrop-blur">
                <Icon className="mx-auto h-5 w-5" />
                <p className="mt-1 text-[11px] font-medium">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-auto space-y-3 pb-[max(env(safe-area-inset-bottom),24px)] pt-8">
            <Button asChild size="lg" className="h-14 w-full rounded-2xl bg-white text-primary text-base font-bold hover:bg-white/95 shadow-float">
              <Link to="/onboarding">Comenzar gratis</Link>
            </Button>
            <Button asChild variant="ghost" className="h-12 w-full rounded-2xl text-primary-foreground hover:bg-white/15">
              <Link to="/app">Explorar la app</Link>
            </Button>
          </div>
        </div>
      </div>
    </MobileShell>
  );
};

export default Welcome;
