import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMarketplaceMerchantById, getMarketplaceProducts } from "@/lib/api";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { Search, Loader2, Coins } from "lucide-react";

const MerchantProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [query, setQuery] = useState("");

  const { data: merchant, isLoading: loadingMerchant } = useQuery({
    queryKey: ["merchant", id],
    queryFn: () => getMarketplaceMerchantById(id!),
    enabled: !!id,
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["merchantProducts", id, query],
    queryFn: () => getMarketplaceProducts({ merchant_partner_id: id, search_query: query }),
    enabled: !!id,
  });

  if (loadingMerchant) {
    return (
      <MobileShell>
        <ScreenHeader title="Perfil del Aliado" back />
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileShell>
    );
  }

  if (!merchant) {
    return (
      <MobileShell>
        <ScreenHeader title="Perfil del Aliado" back />
        <div className="p-10 text-center text-muted-foreground">Aliado no encontrado</div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      {/* If there's a cover image, show it, otherwise show a gradient.
          We don't use ScreenHeader so the cover can go all the way to the top like the mockup, 
          but we still need a back button. We'll use ScreenHeader with variant="light" but absolute, or just a simple back button.
          Actually, ScreenHeader is useful for safe areas. We'll use a custom absolute header to mimic the mockup perfectly. */}
      <div className="relative">
        <div 
          className="h-48 w-full bg-cover bg-center"
          style={{
            backgroundImage: merchant.cover_url 
              ? `url(${merchant.cover_url})` 
              : "linear-gradient(to right, #2b5f3a, #a68b32)", // Similar to the green-gold mockup gradient
          }}
        />
        <div className="absolute top-0 left-0 w-full">
          <ScreenHeader title="" back />
        </div>
      </div>

      <div className="px-5 pb-6 -mt-12 relative z-10">
        {/* Logo */}
        <div className="h-24 w-24 rounded-3xl bg-white shadow-soft flex items-center justify-center p-2 mb-4 overflow-hidden border border-border/50">
          {merchant.logo_url ? (
            <img src={merchant.logo_url} alt={merchant.name || "Logo"} className="h-full w-full object-contain" />
          ) : (
            <span className="text-4xl font-bold text-muted-foreground">{merchant.name?.charAt(0).toUpperCase()}</span>
          )}
        </div>

        {/* Info */}
        <h1 className="font-display text-2xl font-extrabold leading-tight text-foreground">{merchant.name}</h1>
        {merchant.tagline && (
          <p className="text-sm text-muted-foreground mt-1">{merchant.tagline}</p>
        )}
        
        {merchant.category && (
          <div className="mt-3">
            <span className="inline-block bg-[#eef5f0] text-[#2b5f3a] text-xs font-bold px-3 py-1 rounded-full">
              {merchant.category}
            </span>
          </div>
        )}

        {merchant.description && (
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {merchant.description}
          </p>
        )}

        {/* Search */}
        <div className="mt-6 flex items-center gap-2 rounded-2xl bg-muted/50 px-3 py-1 shadow-inner border border-border/50">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar productos"
            className="h-10 flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-xs font-semibold text-primary">Limpiar</button>
          )}
        </div>

        {/* Catalog */}
        <div className="mt-6 flex items-center justify-between">
          <h2 className="font-display text-base font-bold">Catálogo</h2>
          <span className="text-xs text-muted-foreground">{products.length} productos</span>
        </div>

        {loadingProducts ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No se encontraron productos.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 pb-2">
            {products.map((m) => (
              <Link
                key={m.id}
                to={`/app/marketplace/${m.id}`}
                className={`flex flex-col overflow-hidden rounded-3xl bg-card shadow-soft transition-bounce hover:-translate-y-0.5 border border-border/50 relative ${
                  m.stock === 0 ? "grayscale opacity-[70%]" : ""
                }`}
              >
                <div className="relative flex h-32 items-center justify-center bg-[#eef5f0] text-5xl overflow-hidden p-2">
                  {m.image_url ? (
                    <img src={m.image_url} alt={m.name} className="h-full w-full object-contain mix-blend-multiply" />
                  ) : (
                    <span className="text-[#2b5f3a] opacity-50">{m.name.charAt(0).toUpperCase()}</span>
                  )}
                  {m.featured && (
                    <span className="absolute left-2 top-2 rounded-full bg-accent px-2 py-0.5 text-[9px] font-extrabold uppercase text-accent-foreground shadow-sm z-10">
                      TOP
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3 border-t border-border/50">
                  <p className="mt-0.5 line-clamp-2 text-sm font-bold leading-tight">{m.name}</p>
                  {m.stock === 0 ? (
                    <div className="mt-2 text-xs font-bold text-muted-foreground bg-muted w-fit px-2 py-0.5 rounded-lg z-10 relative">
                      Sin stock
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-1 text-xs font-bold text-[#b59a3e] z-10 relative">
                      {m.points} <Coins className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  );
};

export default MerchantProfile;
