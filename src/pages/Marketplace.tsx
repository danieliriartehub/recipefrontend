import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { getActiveBanners } from "@/lib/api";
import { MARKETPLACE, type MarketItem } from "@/data/mock";
import { useAuth } from "@/lib/auth";
import { Search, Sparkles, Wallet } from "lucide-react";

const categories = ["Todos", "Producto", "Cafetería", "Transporte", "Experiencia", "Donación"] as const;

const Marketplace = () => {
  const { profile } = useAuth();
  const userPoints = profile?.points ?? 0;

  const { data: banners = [] } = useQuery({
    queryKey: ["activeBanners"],
    queryFn: getActiveBanners,
    staleTime: 1000 * 60 * 5,
  });

  const [cat, setCat] = useState<(typeof categories)[number]>("Todos");
  const [query, setQuery] = useState("");

  const list: MarketItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MARKETPLACE.filter((m) => {
      const matchCat = cat === "Todos" || m.category === cat;
      const matchQ = !q || [m.title, m.brand, m.category, m.description].some((f) => f.toLowerCase().includes(q));
      return matchCat && matchQ;
    });
  }, [cat, query]);

  const featured = MARKETPLACE.find((m) => m.tag === "Top venta")!;

  return (
    <MobileShell>
      <ScreenHeader title="Eco Marketplace" subtitle="Convierte impacto en recompensas reales" back />

      {/* Sticky search */}
      <div className="sticky top-0 z-30 -mt-2 bg-background/85 px-5 pb-3 pt-2 backdrop-blur-xl">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 shadow-soft">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar recompensas sostenibles…"
            className="h-11 flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-xs font-semibold text-primary">Limpiar</button>
          )}
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Balance card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-5 text-primary-foreground shadow-card">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider opacity-80">Tu wallet ecológica</p>
              <p className="font-display text-4xl font-extrabold leading-none">{userPoints.toLocaleString()}<span className="ml-1 text-sm font-bold">pts</span></p>
            </div>
            <Link to="/app/wallet" className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-2 text-xs font-bold backdrop-blur">
              <Wallet className="h-4 w-4" /> Historial
            </Link>
          </div>
        </div>

        {/* Featured */}
        {!query && (
          <Link to={`/app/marketplace/${featured.id}`} className="block">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-accent p-5 text-accent-foreground shadow-card transition-bounce hover:-translate-y-0.5">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Sparkles className="h-4 w-4" /> DESTACADO DE LA SEMANA
              </div>
              <div className="mt-3 flex items-center gap-4">
                <span className="text-5xl">{featured.emoji}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-extrabold leading-tight">{featured.title}</p>
                  <p className="text-xs opacity-80">{featured.brand}</p>
                </div>
                <span className="rounded-full bg-foreground/10 px-3 py-1.5 text-sm font-extrabold">{featured.cost}pts</span>
              </div>
            </div>
          </Link>
        )}

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-smooth ${
                cat === c ? "bg-primary text-primary-foreground shadow-soft" : "bg-card text-muted-foreground border border-border"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Grid */}
        {list.length === 0 ? (
          <div className="rounded-3xl bg-card p-8 text-center shadow-soft">
            <p className="text-4xl">🔍</p>
            <p className="mt-2 font-display text-sm font-bold">Sin resultados</p>
            <p className="text-xs text-muted-foreground">Prueba con otra categoría o término</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pb-2">
            {list.map((m, index) => {
              const showAd = index > 0 && index % 4 === 0;
              const adIndex = Math.floor(index / 4) - 1;
              const banner = banners.length > 0 ? banners[adIndex % banners.length] : null;

              return (
                <React.Fragment key={m.id}>
                  {showAd && banner && (
                    <div className="col-span-2 relative rounded-2xl overflow-hidden shadow-card group my-1">
                      {banner.link_url || banner.website_url ? (
                        <a href={banner.link_url || banner.website_url} target="_blank" rel="noopener noreferrer" className="block w-full">
                          <img src={banner.banner_url} alt={banner.title || banner.business_name} className="w-full aspect-[21/9] object-cover animate-in fade-in duration-500" />
                        </a>
                      ) : (
                        <img src={banner.banner_url} alt={banner.title || banner.business_name} className="w-full aspect-[21/9] object-cover animate-in fade-in duration-500" />
                      )}
                      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded shadow-sm text-foreground z-10">
                        Patrocinado
                      </div>
                    </div>
                  )}
                  <Link
                    to={`/app/marketplace/${m.id}`}
                    className="flex flex-col overflow-hidden rounded-3xl bg-card shadow-soft transition-bounce hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    <div className="relative flex h-24 items-center justify-center bg-gradient-soft text-5xl">
                      {m.emoji}
                      {m.tag && (
                        <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[9px] font-extrabold uppercase text-accent-foreground">
                          {m.tag}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{m.brand}</p>
                      <p className="mt-0.5 line-clamp-2 text-sm font-bold leading-tight">{m.title}</p>
                      <p className="mt-1 line-clamp-2 flex-1 text-[11px] text-muted-foreground">{m.description}</p>
                      <span className="mt-3 inline-flex h-9 items-center justify-center rounded-xl bg-gradient-primary text-sm font-bold text-primary-foreground shadow-soft">
                        {m.cost} pts
                      </span>
                    </div>
                  </Link>
                </React.Fragment>
              );
            })}
          </div>
        )}

        <p className="pb-4 text-center text-[11px] text-muted-foreground">
          🌍 Cada canje en RECIPE financia una acción de reforestación
        </p>
      </div>
    </MobileShell>
  );
};

export default Marketplace;
