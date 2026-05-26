import { ArrowLeft, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  /** Acción personalizada al pulsar Atrás. Si no se pasa y back=true, usa nav(-1). */
  onBack?: () => void;
  showBell?: boolean;
  variant?: "light" | "gradient";
}

export const ScreenHeader = ({ title, subtitle, back, onBack, showBell, variant = "light" }: ScreenHeaderProps) => {
  const nav = useNavigate();
  const isGradient = variant === "gradient";
  return (
    <header
      className={`sticky top-0 z-30 px-5 pb-4 pt-[max(env(safe-area-inset-top),16px)] ${
        isGradient
          ? "bg-gradient-hero text-primary-foreground rounded-b-3xl shadow-card"
          : "bg-background/95 backdrop-blur border-b border-border/60"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {back && (
            <button
              onClick={() => onBack ? onBack() : nav(-1)}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-smooth ${
                isGradient ? "bg-white/15 hover:bg-white/25" : "bg-muted hover:bg-muted/70"
              }`}
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="font-display text-xl font-bold">{title}</h1>
            {subtitle && (
              <p className={`text-sm ${isGradient ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {showBell && (
          <button
            onClick={() => nav("/app/notifications")}
            className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-smooth ${
              isGradient ? "bg-white/15 hover:bg-white/25" : "bg-muted hover:bg-muted/70"
            }`}
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />
          </button>
        )}
      </div>
    </header>
  );
};
