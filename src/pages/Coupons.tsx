import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { useAuth } from "@/lib/auth";
import { getUserCoupons } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const tabs = ["activos", "usados", "expirados"] as const;
type Tab = (typeof tabs)[number];

const statusMap: Record<Tab, string> = {
  activos:   "activo",
  usados:    "usado",
  expirados: "expirado",
};

const statusBadge = (s: string) => {
  if (s === "activo")   return "bg-success/15 text-success";
  if (s === "usado")    return "bg-secondary/15 text-secondary";
  return "bg-destructive/10 text-destructive";
};

const Coupons = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("activos");

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["coupons", user?.id],
    queryFn: () => getUserCoupons(user!.id),
    enabled: !!user,
  });

  const filtered = Array.isArray(coupons) ? coupons.filter((c: any) => c.status === statusMap[tab]) : [];

  const getEmptyText = () => {
    if (tab === "activos") return "No tienes cupones activos todavía.";
    if (tab === "usados") return "No tienes cupones utilizados todavía.";
    return "No tienes cupones expirados.";
  };

  const getDateLabel = () => {
    if (tab === "activos") return "Expira: ";
    if (tab === "usados") return "Usado: ";
    return "Expiró: ";
  };

  const getDateValue = (c: any) => {
    const d = tab === "activos" || tab === "expirados" ? (c.expires_at || c.valid_until) : (c.used_at || c.redeemed_at);
    return d ? new Date(d).toLocaleDateString("es-PE", {
      day: "numeric", month: "short", year: "numeric",
    }) : "—";
  };

  return (
    <MobileShell>
      <ScreenHeader title="Mis cupones" subtitle="Historial de recompensas" back />

      <div className="px-5">
        {/* Tabs */}
        <div className="grid grid-cols-3 rounded-2xl bg-muted p-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-xl py-2 text-sm font-semibold capitalize transition-smooth ${
                tab === t ? "bg-background shadow-soft text-foreground" : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3 pb-4">
          {/* Loading skeleton */}
          {isLoading && [1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}

          {/* Lista de cupones */}
          {!isLoading && filtered.map((c: any) => {
            const r = c.rewards || c.reward || null;

            return (
              <div key={c.id} className="overflow-hidden rounded-2xl bg-card shadow-soft">
                <div className="flex items-center gap-3 p-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-soft text-3xl">
                    {r?.emoji ?? "🎁"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {r?.brand ?? "—"}
                    </p>
                    <p className="truncate text-sm font-bold">{r?.title ?? "Recompensa"}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {getDateLabel()}{getDateValue(c)} • {c.points_spent ?? r?.points_cost ?? c.points_cost ?? 0} pts
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${statusBadge(c.status || statusMap[tab])}`}>
                    {c.status || statusMap[tab]}
                  </span>
                </div>

                {c.code && (
                  <div className="flex w-full items-center justify-between border-t border-dashed border-border bg-muted/40 px-4 py-3">
                    <span className="font-mono text-sm font-bold tracking-wider">{c.code}</span>
                    {tab === "activos" && (
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(c.code);
                          toast.success("Código copiado");
                        }}
                        className="flex items-center gap-1 text-xs font-semibold text-primary"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copiar
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Vacío */}
          {!isLoading && filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {getEmptyText()}
              </p>
              {tab === "activos" && (
                <Link to="/app/marketplace" className="mt-2 inline-block text-xs font-bold text-primary">
                  Canjear en Marketplace →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
};

export default Coupons;
