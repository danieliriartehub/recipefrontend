import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { CENTERS, MATERIALS, MaterialType, STATUS_META, CenterStatus } from "@/data/mock";
import { MaterialChip } from "@/components/recipe/MaterialChip";
import { Clock, MapPin, Star, Search, List, Map as MapIcon, WifiOff, Radio } from "lucide-react";
import { Input } from "@/components/ui/input";

const MapView = () => {
  const [filters, setFilters] = useState<MaterialType[]>([]);
  const [view, setView] = useState<"map" | "list">("map");
  const [query, setQuery] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);

  const toggle = (m: MaterialType) =>
    setFilters((f) => (f.includes(m) ? f.filter((x) => x !== m) : [...f, m]));

  const filtered = useMemo(() => {
    return CENTERS.filter((c) => {
      const matchMat = filters.length === 0 || filters.every((f) => c.materials.includes(f));
      const matchQ = !query || (c.name + c.district + c.address).toLowerCase().includes(query.toLowerCase());
      const matchOpen = !onlyOpen || (c.status !== "cerrado" && c.status !== "mantenimiento" && c.status !== "lleno");
      return matchMat && matchQ && matchOpen;
    });
  }, [filters, query, onlyOpen]);

  return (
    <MobileShell>
      <ScreenHeader title="Mapa inteligente" subtitle={`${filtered.length} puntos en Lima · tiempo real`} showBell />

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

          {/* User location */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-secondary/40 animate-pulse-glow" style={{ width: 36, height: 36, marginLeft: -18, marginTop: -18 }} />
              <div className="h-4 w-4 rounded-full bg-secondary ring-4 ring-white shadow-card" />
            </div>
          </div>

          {/* Pins with status color */}
          {filtered.slice(0, 6).map((c, i) => {
            const positions = [
              { l: "22%", t: "28%" }, { l: "68%", t: "22%" }, { l: "78%", t: "62%" },
              { l: "30%", t: "70%" }, { l: "55%", t: "48%" }, { l: "12%", t: "55%" },
            ];
            const p = positions[i];
            const s = STATUS_META[c.status];
            return (
              <Link
                key={c.id}
                to={`/app/center/${c.id}`}
                className="absolute -translate-x-1/2 -translate-y-full transition-bounce hover:scale-110"
                style={{ left: p.l, top: p.t }}
              >
                <div className="flex flex-col items-center">
                  <div className="rounded-2xl bg-card px-2 py-1 text-[10px] font-bold shadow-card whitespace-nowrap">
                    {c.distanceKm} km
                  </div>
                  <div className={`-mt-1 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-card ${s.dot}`}>
                    {c.isMobile ? <Radio className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                  </div>
                </div>
              </Link>
            );
          })}

          <div className="absolute bottom-3 left-3 rounded-full bg-card/90 px-3 py-1.5 text-xs font-medium shadow-card backdrop-blur">
            📍 San Miguel · GPS activo
          </div>

          {/* Legend */}
          <div className="absolute bottom-3 right-3 flex gap-1.5 rounded-full bg-card/90 px-2.5 py-1.5 text-[10px] font-semibold shadow-card backdrop-blur">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" />Libre</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" />Demanda</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" />Lleno</span>
          </div>
        </div>
      )}

      <section className="px-5 pt-4 space-y-3">
        {filtered.map((c) => {
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
                    {c.isMobile && <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[9px] font-bold text-secondary">📡 MÓVIL</span>}
                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot} animate-pulse`} />
                      {s.label}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.district} · {c.address}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {c.materials.map((m) => <MaterialChip key={m} material={m} size="sm" />)}
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
                  <p className="mt-1 font-display text-lg font-extrabold text-primary">{c.distanceKm}<span className="text-xs">km</span></p>
                  <div className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> {c.etaMin} min
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className="space-y-3 rounded-2xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">No hay puntos disponibles cerca con esos filtros.</p>
            <Link to="/app/community" className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold text-primary">
              📡 Ver campañas móviles y eventos universitarios
            </Link>
          </div>
        )}

        {/* Offline mode hint */}
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <WifiOff className="h-4 w-4" />
          <span><strong>Modo offline:</strong> los últimos 6 puntos siguen disponibles sin conexión.</span>
        </div>
      </section>
    </MobileShell>
  );
};

export default MapView;
