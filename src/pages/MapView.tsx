import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { MATERIALS, MaterialType, STATUS_META, CenterStatus } from "@/data/mock";
import { MaterialChip } from "@/components/recipe/MaterialChip";
import { Clock, MapPin, Star, Search, List, Map as MapIcon, WifiOff, Radio } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getCenters, searchCenters } from "@/lib/api";

const MapView = () => {
  const [filters, setFilters] = useState<MaterialType[]>([]);
  const [view, setView] = useState<"map" | "list">("map");
  const [query, setQuery] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);

  const hasFilters = !!query || filters.length > 0 || onlyOpen;

  // ── Query server-side: usa searchCenters cuando hay filtros, getCenters si no ──
  const { data: centers = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["centers", query, filters, onlyOpen],
    queryFn: () => {
      if (hasFilters) {
        return searchCenters({
          campus:     query     || undefined,
          material:   filters[0],           // primer material seleccionado
          onlyActive: onlyOpen,             // true → excluye cerrado/mantenimiento
        });
      }
      return getCenters();
    },
  });

  const toggle = (m: MaterialType) =>
    setFilters((f) => (f.includes(m) ? f.filter((x) => x !== m) : [...f, m]));

  const clearFilters = () => {
    setQuery("");
    setFilters([]);
    setOnlyOpen(false);
  };

  return (
    <MobileShell>
      <ScreenHeader
        title="Mapa inteligente"
        subtitle={`${centers.length} puntos en Lima · tiempo real`}
        showBell
      />

      <div className="px-5 pt-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar distrito, universidad o centro…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 rounded-2xl border-border bg-muted/60 pl-10 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5">
          <button
            onClick={() => setOnlyOpen((v) => !v)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-smooth ${
              onlyOpen ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
            }`}
          >
            🟢 Solo disponibles
          </button>
          {(Object.keys(MATERIALS) as MaterialType[]).map((m) => (
            <MaterialChip key={m} material={m} active={filters.includes(m)} onClick={() => toggle(m)} />
          ))}
        </div>

        <div className="grid grid-cols-2 rounded-2xl bg-muted p-1">
          {(["map", "list"] as const).map((v) => {
            const Icon = v === "map" ? MapIcon : List;
            return (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition-smooth ${
                  view === v ? "bg-background shadow-soft text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {v === "map" ? "Mapa" : "Lista"}
              </button>
            );
          })}
        </div>
      </div>

      {view === "map" && (
        <div className="relative mx-5 mt-4 h-[300px] overflow-hidden rounded-3xl border border-border shadow-card">
          <div className="absolute inset-0 bg-[hsl(150_30%_94%)]">
            <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="hsl(150 25% 86%)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="400" height="400" fill="url(#grid)" />
              <path d="M0,180 Q100,140 200,180 T400,160" stroke="hsl(200 60% 75%)" strokeWidth="14" fill="none" opacity="0.5" />
              <path d="M40,0 L60,400" stroke="hsl(150 30% 80%)" strokeWidth="22" fill="none" />
              <path d="M0,260 L400,300" stroke="hsl(150 30% 80%)" strokeWidth="18" fill="none" />
              <circle cx="200" cy="200" r="60" fill="hsl(152 65% 38% / 0.08)" />
            </svg>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-secondary/40 animate-pulse-glow" style={{ width: 36, height: 36, marginLeft: -18, marginTop: -18 }} />
              <div className="h-4 w-4 rounded-full bg-secondary ring-4 ring-white shadow-card" />
            </div>
          </div>

          {(centers as any[]).slice(0, 6).map((c: any, i: number) => {
            const positions = [
              { l: "22%", t: "28%" }, { l: "68%", t: "22%" }, { l: "78%", t: "62%" },
              { l: "30%", t: "70%" }, { l: "55%", t: "48%" }, { l: "12%", t: "55%" },
            ];
            const p = positions[i];
            const s = STATUS_META[c.status as CenterStatus];
            return (
              <Link
                key={c.id}
                to={`/app/center/${c.id}`}
                className="absolute -translate-x-1/2 -translate-y-full transition-bounce hover:scale-110"
                style={{ left: p.l, top: p.t }}
              >
                <div className="flex flex-col items-center">
                  <div className="rounded-2xl bg-card px-2 py-1 text-[10px] font-bold shadow-card whitespace-nowrap">
                    {c.lat?.toFixed(2)}
                  </div>
                  <div className={`-mt-1 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-card ${s?.dot}`}>
                    {c.is_mobile ? <Radio className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                  </div>
                </div>
              </Link>
            );
          })}

          <div className="absolute bottom-3 left-3 rounded-full bg-card/90 px-3 py-1.5 text-xs font-medium shadow-card backdrop-blur">
            📍 Lima · GPS activo
          </div>
          <div className="absolute bottom-3 right-3 flex gap-1.5 rounded-full bg-card/90 px-2.5 py-1.5 text-[10px] font-semibold shadow-card backdrop-blur">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" />Libre</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" />Demanda</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" />Lleno</span>
          </div>
        </div>
      )}

      <section className="px-5 pt-4 space-y-3">
        {/* ── Error de red ── */}
        {isError && (
          <div className="p-6 text-center space-y-2">
            <p className="text-sm text-destructive font-medium">
              No se pudo cargar la información de centros.
            </p>
            <button
              onClick={() => refetch()}
              className="text-xs text-primary underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* ── Skeletons mientras carga (incluso al cambiar filtros) ── */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        )}

        {/* ── Lista de centros ── */}
        {!isLoading && !isError && (centers as any[]).map((c: any) => {
          const s = STATUS_META[c.status as CenterStatus];
          return (
            <Link
              key={c.id}
              to={`/app/center/${c.id}`}
              className="block rounded-2xl bg-card p-4 shadow-soft transition-bounce hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate font-display text-base font-bold">{c.name}</h4>
                    {c.is_mobile && (
                      <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[9px] font-bold text-secondary">📡 MÓVIL</span>
                    )}
                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s?.bg} ${s?.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${s?.dot} animate-pulse`} />
                      {s?.label}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.district} · {c.address}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(c.accepted_materials as MaterialType[])?.map((m) => (
                      <MaterialChip key={m} material={m} size="sm" />
                    ))}
                  </div>
                  {c.status !== "mantenimiento" && c.status !== "cerrado" && (
                    <div className="mt-2 flex items-center gap-3 text-[11px]">
                      <span className="text-muted-foreground">Capacidad</span>
                      <div className="h-1 w-20 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full ${c.capacity > 80 ? "bg-orange-500" : c.capacity > 60 ? "bg-accent" : "bg-success"}`}
                          style={{ width: `${c.capacity}%` }}
                        />
                      </div>
                      <span className="font-semibold text-muted-foreground">{c.capacity}%</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 text-xs font-semibold">
                    <Star className="h-3.5 w-3.5 fill-accent text-accent" /> {c.rating}
                  </div>
                  <p className="mt-1 font-display text-lg font-extrabold text-primary">
                    {c.wait_minutes}<span className="text-xs">min</span>
                  </p>
                  <div className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> espera
                  </div>
                </div>
              </div>
            </Link>
          );
        })}

        {/* ── Empty state ── */}
        {!isLoading && !isError && centers.length === 0 && (
          <div className="space-y-3 rounded-2xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No encontramos centros con esos filtros.
            </p>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold text-primary"
            >
              Limpiar filtros
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <WifiOff className="h-4 w-4" />
          <span><strong>Modo offline:</strong> los últimos centros siguen disponibles sin conexión.</span>
        </div>
      </section>
    </MobileShell>
  );
};

export default MapView;
