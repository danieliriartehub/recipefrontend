import { useState } from "react";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { COUPONS, REWARDS } from "@/data/mock";
import { Copy } from "lucide-react";
import { toast } from "sonner";

const tabs = ["activos", "usados", "expirados"] as const;

const Coupons = () => {
  const [tab, setTab] = useState<(typeof tabs)[number]>("activos");

  const map = { activos: "activo", usados: "usado", expirados: "expirado" } as const;
  const filtered = COUPONS.filter((c) => c.status === map[tab]);

  const statusBadge = (s: string) => {
    if (s === "activo") return "bg-success/15 text-success";
    if (s === "usado") return "bg-secondary/15 text-secondary";
    return "bg-destructive/10 text-destructive";
  };

  return (
    <MobileShell>
      <ScreenHeader title="Mis cupones" subtitle="Historial de recompensas" back />

      <div className="px-5">
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
          {filtered.map((c) => {
            const r = REWARDS.find((x) => x.id === c.rewardId)!;
            return (
              <div key={c.id} className="overflow-hidden rounded-2xl bg-card shadow-soft">
                <div className="flex items-center gap-3 p-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-soft text-3xl">
                    {r.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{r.brand}</p>
                    <p className="truncate text-sm font-bold">{r.title}</p>
                    <p className="text-[11px] text-muted-foreground">{c.date}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${statusBadge(c.status)}`}>
                    {c.status}
                  </span>
                </div>
                {c.status === "activo" && (
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(c.code);
                      toast.success("Código copiado");
                    }}
                    className="flex w-full items-center justify-between border-t border-dashed border-border bg-muted/40 px-4 py-3"
                  >
                    <span className="font-mono text-sm font-bold tracking-wider">{c.code}</span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                      <Copy className="h-3.5 w-3.5" /> Copiar
                    </span>
                  </button>
                )}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              No tienes cupones {tab} todavía.
            </div>
          )}
        </div>
      </div>
    </MobileShell>
  );
};

export default Coupons;
