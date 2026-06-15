import React, { useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { getActiveBanners, getMarketplaceCategories, getMarketplaceProducts, getMarketplaceMerchants } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Search, Sparkles, Wallet, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const Marketplace = () => {
  const { profile } = useAuth();
  const userPoints = profile?.points ?? 0;
  
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -200 : 200;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const { data: banners = [] } = useQuery({
    queryKey: ["activeBanners"],
    queryFn: getActiveBanners,
    staleTime: 1000 * 60 * 5,
  });

  const [cat, setCat] = useState<string>("Todos");
  const [query, setQuery] = useState("");

  const { data: serverCategories = [] } = useQuery({
    queryKey: ["marketplaceCategories"],
    queryFn: getMarketplaceCategories,
    staleTime: 1000 * 60 * 60, // 1 hora
  });

  const { data: merchants = [] } = useQuery({
    queryKey: ["marketplaceMerchants"],
    queryFn: getMarketplaceMerchants,
    staleTime: 1000 * 60 * 60, // 1 hora
  });

  const allCategories = useMemo(() => ["Todos", ...serverCategories], [serverCategories]);

  const { data: list = [], isLoading } = useQuery({
    queryKey: ["marketplaceProducts", query, cat],
    queryFn: () => getMarketplaceProducts({
      search_query: query,
      category: cat === "Todos" ? undefined : cat,
    }),
  });

  const featured = useMemo(() => list.find((m) => m.featured), [list]);

  return (
    <MobileShell>
      <ScreenHeader title="Eco Marketplace" subtitle="Convierte impacto en recompensas reales" back />

      {/* Sticky search */}
      <div className="sticky top-[68px] z-20 -mt-2 bg-background/85 px-5 pb-3 pt-2 backdrop-blur-xl">
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
        {!query && featured && (
          <Link to={`/app/marketplace/${featured.id}`} className={`block relative ${featured.stock === 0 ? "grayscale opacity-[70%]" : ""}`}>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-accent p-5 text-accent-foreground shadow-card transition-bounce hover:-translate-y-0.5">
              <div className="flex items-center gap-2 text-xs font-bold">
                <Sparkles className="h-4 w-4" /> DESTACADO DE LA SEMANA
              </div>
              <div className="mt-3 flex items-center gap-4">
                {featured.image_url ? (
                  <img src={featured.image_url} alt={featured.name} className="h-16 w-16 rounded-xl object-cover" />
                ) : (
                  <span className="text-5xl">{featured.name.charAt(0).toUpperCase()}</span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-extrabold leading-tight">{featured.name}</p>
                  <p className="text-xs opacity-80">{featured.merchant.name}</p>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-sm font-extrabold ${featured.stock === 0 ? "bg-white/40" : "bg-foreground/10"}`}>
                  {featured.stock === 0 ? "Sin stock" : `${featured.points} pts`}
                </span>
              </div>
            </div>
          </Link>
        )}

        {/* Merchants / Aliados */}
        {merchants.length > 0 && (
          <div className="space-y-3 pt-2 relative">
            <h2 className="font-display text-sm font-bold px-1">Nuestros Aliados</h2>
            <div className="relative group">
              <button 
                onClick={() => scroll("left")} 
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-card backdrop-blur border border-border text-foreground"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide -mx-5 px-12 pb-2 scroll-smooth">
                {merchants.map((merchant) => (
                  <Link key={merchant.id} to={`/app/merchant/${merchant.id}`} className="flex flex-col items-center gap-2 min-w-[72px] transition-transform active:scale-95">
                    <div className="h-16 w-16 rounded-full bg-card shadow-soft overflow-hidden border border-border/50 flex items-center justify-center p-1">
                      {merchant.logo_url ? (
                        <img src={merchant.logo_url} alt={merchant.name} className="h-full w-full object-contain rounded-full" />
                      ) : (
                        <span className="text-xl font-bold text-muted-foreground">{merchant.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-center leading-tight line-clamp-2 max-w-[72px]">{merchant.name}</span>
                  </Link>
                ))}
              </div>

              <button 
                onClick={() => scroll("right")} 
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-card backdrop-blur border border-border text-foreground"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5">
          {allCategories.map((c) => (
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
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : list.length === 0 ? (
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
                      {banner.link_url ? 
                        <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block w-full">
                          <img src={banner.banner_url} alt={banner.title || banner.business_name} className="w-full aspect-[21/9] object-cover animate-in fade-in duration-500" />
                        </a>
                       : 
                        <img src={banner.banner_url} alt={banner.title || banner.business_name} className="w-full aspect-[21/9] object-cover animate-in fade-in duration-500" />
                      }
                      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded shadow-sm text-foreground z-10">
                        Patrocinado
                      </div>
                    </div>
                  )}
                  <Link
                    to={`/app/marketplace/${m.id}`}
                    className={`flex flex-col overflow-hidden rounded-3xl bg-card shadow-soft transition-bounce hover:-translate-y-0.5 active:scale-[0.98] relative ${
                      m.stock === 0 ? "grayscale opacity-[70%]" : ""
                    }`}
                  >
                    <div className="relative flex h-24 items-center justify-center bg-gradient-soft text-5xl overflow-hidden">
                      {m.image_url ? (
                        <img src={m.image_url} alt={m.name} className="h-full w-full object-cover" />
                      ) : (
                        <span>{m.name.charAt(0).toUpperCase()}</span>
                      )}
                      {m.featured && (
                        <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[9px] font-extrabold uppercase text-accent-foreground shadow-sm z-10">
                          TOP
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{m.merchant.name}</p>
                      <p className="mt-0.5 line-clamp-2 text-sm font-bold leading-tight">{m.name}</p>
                      <p className="mt-1 line-clamp-2 flex-1 text-[11px] text-muted-foreground">{m.short_description}</p>
                      <span className={`mt-3 inline-flex h-9 items-center justify-center rounded-xl text-sm font-bold shadow-soft z-10 relative ${
                        m.stock === 0 ? "bg-muted text-muted-foreground" : "bg-gradient-primary text-primary-foreground"
                      }`}>
                        {m.stock === 0 ? "Sin stock" : `${m.points} pts`}
                      </span>
                    </div>
                  </Link>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </MobileShell>
  );
};

export default Marketplace;
