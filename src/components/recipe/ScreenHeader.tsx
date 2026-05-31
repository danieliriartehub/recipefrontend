import { ArrowLeft, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

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
  const { user } = useAuth();

  // Cuenta notificaciones sin leer — solo cuando la campana está visible
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications_unread", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("read", false);
      return count ?? 0;
    },
    enabled: showBell && !!user,
    staleTime: 1000 * 60,
  });
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
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-accent" />
            )}
          </button>
        )}
      </div>
    </header>
  );
};
