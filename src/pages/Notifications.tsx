import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { useAuth } from "@/lib/auth";
import { getNotifications } from "@/lib/api";
import { Bell, Gift, Sparkles, Trophy, Zap } from "lucide-react";

// ─── Icono por tipo de notificación ──────────────────────────────────────────
const iconFor = (type: string) => {
  if (type === "promo")       return { Icon: Gift,   color: "bg-accent/20 text-accent-foreground" };
  if (type === "achievement") return { Icon: Trophy, color: "bg-primary/15 text-primary" };
  return { Icon: Bell, color: "bg-secondary/15 text-secondary" };
};

// ─── Formato de fecha en español ─────────────────────────────────────────────
const fmtDate = (iso: string | null) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
};

// ─── Skeleton (mientras carga) ────────────────────────────────────────────────
const LoadingSkeleton = () => (
  <div className="space-y-2">
    {[1, 2, 3].map((i) => (
      <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
    ))}
  </div>
);

// ─── Estado vacío (usuario nuevo sin notificaciones) ─────────────────────────
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Bell className="h-12 w-12 text-muted-foreground" />
    <p className="mt-4 font-display text-lg font-bold">Todo listo para empezar</p>
    <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
      Tus notificaciones personalizadas aparecerán aquí cuando comiences a reciclar.
    </p>
    <Link
      to="/app/map"
      className="mt-6 rounded-full bg-primary px-6 py-2 text-sm font-bold text-primary-foreground"
    >
      Ir a reciclar →
    </Link>
  </div>
);

// ─── Componente principal ─────────────────────────────────────────────────────
const Notifications = () => {
  const [tab, setTab] = useState<"smart" | "todas">("smart");
  const { user } = useAuth();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn:  () => getNotifications(user!.id),
    enabled:  !!user,
  });

  const isEmpty = !isLoading && notifications.length === 0;

  return (
    <MobileShell>
      <ScreenHeader
        title="Notificaciones"
        subtitle="Personalizadas por IA · siempre relevantes"
        back
      />

      <div className="px-5 pb-4">
        {/* Tabs */}
        <div className="mb-4 grid grid-cols-2 rounded-2xl bg-muted p-1">
          {([
            { k: "smart", l: "Para ti · IA" },
            { k: "todas", l: "Todas" },
          ] as const).map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`rounded-xl py-2 text-xs font-semibold transition-smooth ${
                tab === t.k
                  ? "bg-background text-foreground shadow-soft"
                  : "text-muted-foreground"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>

        {/* Estados: cargando / vacío / datos */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : isEmpty ? (
          /* Mismo empty state para ambos tabs */
          <EmptyState />
        ) : tab === "smart" ? (

          /* ── Tab "Para ti · IA" ── */
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
              <Sparkles className="h-4 w-4" />
              <span>RECIPE AI te envía alertas basadas en tu comportamiento ecológico.</span>
            </div>

            {(notifications as any[]).map((n) => {
              const isHi = n.priority === "high" || !n.read;
              return (
                <div
                  key={n.id}
                  className={`flex gap-3 rounded-2xl p-4 shadow-soft transition-smooth ${
                    isHi
                      ? "border-l-4 border-primary bg-gradient-to-br from-primary/8 to-accent/8"
                      : "bg-card"
                  }`}
                >
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gradient-primary text-xl text-primary-foreground shadow-soft">
                    {n.emoji ?? "🔔"}
                  </span>
                  <div className="min-w-0 flex-1">
                    {n.ai_tag && (
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-3 w-3 text-primary" />
                        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                          {n.ai_tag}
                        </p>
                      </div>
                    )}
                    <p className="mt-0.5 text-sm font-bold leading-tight">{n.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1.5 text-[10px] font-medium text-primary">
                      {fmtDate(n.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        ) : (

          /* ── Tab "Todas" ── */
          <div className="space-y-2">
            {(notifications as any[]).map((n) => {
              const { Icon, color } = iconFor(n.type ?? "");
              return (
                <div
                  key={n.id}
                  className={`flex gap-3 rounded-2xl p-4 shadow-soft transition-smooth ${
                    n.read ? "bg-card" : "border-l-4 border-primary bg-card"
                  }`}
                >
                  <div className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{n.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1.5 text-[11px] font-medium text-primary">
                      {fmtDate(n.created_at)}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="mt-1 h-2 w-2 flex-none rounded-full bg-accent" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MobileShell>
  );
};

export default Notifications;
