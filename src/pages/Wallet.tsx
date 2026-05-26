import { useState } from "react";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { WALLET, USER } from "@/data/mock";
import { ArrowDownLeft, ArrowUpRight, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

type Filter = "todos" | "earned" | "spent";

const Wallet = () => {
  const [filter, setFilter] = useState<Filter>("todos");
  const list = WALLET.filter((w) => filter === "todos" || w.type === filter || (filter === "earned" && w.type === "bonus"));

  const earned = WALLET.filter((w) => w.points > 0).reduce((s, w) => s + w.points, 0);
  const spent = Math.abs(WALLET.filter((w) => w.points < 0).reduce((s, w) => s + w.points, 0));

  return (
    <MobileShell>
      <ScreenHeader title="Eco Wallet" subtitle="Tu historial ecológico" back />

      <div className="px-5 space-y-5">
        {/* Balance */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-card">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
          <p className="text-[11px] uppercase tracking-wider opacity-80">Balance total</p>
          <p className="font-display text-5xl font-extrabold leading-none">{USER.points.toLocaleString()}</p>
          <p className="mt-1 text-sm opacity-85">EcoPuntos disponibles</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
              <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-85">
                <ArrowDownLeft className="h-3 w-3" /> GANADOS
              </div>
              <p className="mt-1 font-display text-xl font-extrabold">+{earned}</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
              <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-85">
                <ArrowUpRight className="h-3 w-3" /> GASTADOS
              </div>
              <p className="mt-1 font-display text-xl font-extrabold">-{spent}</p>
            </div>
          </div>
        </div>

        {/* CTA marketplace */}
        <Link
          to="/app/marketplace"
          className="flex items-center gap-3 rounded-3xl bg-card p-4 shadow-soft transition-bounce hover:-translate-y-0.5"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-accent text-accent-foreground">
            <Sparkles className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <p className="font-display text-base font-extrabold">Canjea en Marketplace</p>
            <p className="text-xs text-muted-foreground">Más de 20 recompensas eco disponibles</p>
          </div>
          <TrendingUp className="h-5 w-5 text-primary" />
        </Link>

        {/* Filters */}
        <div className="grid grid-cols-3 rounded-2xl bg-muted p-1">
          {([
            { k: "todos",  l: "Todos" },
            { k: "earned", l: "Ingresos" },
            { k: "spent",  l: "Canjes" },
          ] as { k: Filter; l: string }[]).map((t) => (
            <button
              key={t.k}
              onClick={() => setFilter(t.k)}
              className={`rounded-xl py-2 text-xs font-semibold transition-smooth ${
                filter === t.k ? "bg-background text-foreground shadow-soft" : "text-muted-foreground"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-2 pb-4">
          {list.map((w) => {
            const pos = w.points > 0;
            return (
              <div key={w.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-xl">
                  {w.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{w.title}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{w.detail}</p>
                  <p className="text-[10px] text-muted-foreground">{w.date}</p>
                </div>
                <div className="text-right">
                  <p className={`font-display text-base font-extrabold ${pos ? "text-primary" : "text-destructive"}`}>
                    {pos ? "+" : ""}{w.points}
                  </p>
                  {w.type === "bonus" && (
                    <p className="text-[9px] font-bold uppercase text-accent-foreground">Bono</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MobileShell>
  );
};

export default Wallet;
