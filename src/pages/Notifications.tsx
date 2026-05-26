import { useState } from "react";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { NOTIFICATIONS, SMART_NOTIFICATIONS } from "@/data/mock";
import { Bell, Gift, Sparkles, Trophy, Zap } from "lucide-react";

const iconFor = (type: string) => {
  if (type === "promo") return { Icon: Gift, color: "bg-accent/20 text-accent-foreground" };
  if (type === "achievement") return { Icon: Trophy, color: "bg-primary/15 text-primary" };
  return { Icon: Bell, color: "bg-secondary/15 text-secondary" };
};

const Notifications = () => {
  const [tab, setTab] = useState<"smart" | "todas">("smart");

  return (
    <MobileShell>
      <ScreenHeader title="Notificaciones" subtitle="Personalizadas por IA · siempre relevantes" back />

      <div className="px-5 pb-4">
        <div className="mb-4 grid grid-cols-2 rounded-2xl bg-muted p-1">
          {([
            { k: "smart", l: "Para ti · IA" },
            { k: "todas", l: "Todas" },
          ] as const).map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`rounded-xl py-2 text-xs font-semibold transition-smooth ${
                tab === t.k ? "bg-background text-foreground shadow-soft" : "text-muted-foreground"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>

        {tab === "smart" && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
              <Sparkles className="h-4 w-4" />
              <span>RECIPE AI te envía alertas basadas en tu comportamiento ecológico.</span>
            </div>
            {SMART_NOTIFICATIONS.map((n) => {
              const isHi = n.priority === "high";
              return (
                <div
                  key={n.id}
                  className={`flex gap-3 rounded-2xl p-4 shadow-soft transition-smooth ${
                    isHi ? "bg-gradient-to-br from-primary/8 to-accent/8 border-l-4 border-primary" : "bg-card"
                  }`}
                >
                  <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gradient-primary text-xl text-primary-foreground shadow-soft">
                    {n.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Zap className="h-3 w-3 text-primary" />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{n.aiTag}</p>
                    </div>
                    <p className="mt-0.5 text-sm font-bold leading-tight">{n.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1.5 text-[10px] font-medium text-primary">{n.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "todas" && (
          <div className="space-y-2">
            {NOTIFICATIONS.map((n) => {
              const { Icon, color } = iconFor(n.type);
              return (
                <div
                  key={n.id}
                  className={`flex gap-3 rounded-2xl p-4 shadow-soft transition-smooth ${
                    n.read ? "bg-card" : "bg-card border-l-4 border-primary"
                  }`}
                >
                  <div className={`flex h-11 w-11 flex-none items-center justify-center rounded-xl ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{n.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1.5 text-[11px] font-medium text-primary">{n.time}</p>
                  </div>
                  {!n.read && <span className="mt-1 h-2 w-2 flex-none rounded-full bg-accent" />}
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
