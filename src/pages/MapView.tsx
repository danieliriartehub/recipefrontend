import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { Clock, MapPin, Star, Search, List, Map as MapIcon, WifiOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getCenters } from "@/lib/api";

// ─── Constantes locales — sin imports de mock ─────────────────────────────────

const MATERIAL_META: Record<string, { label: string; emoji: string }> = {
  plastico: { label: "Plástico", emoji: "🧴" },
  papel:    { label: "Papel",    emoji: "📄" },
  vidrio:   { label: "Vidrio",   emoji: "🍾" },
  aluminio: { label: "Aluminio", emoji: "🥫" },
};

const MATERIAL_KEYS = ["plastico", "papel", "vidrio", "aluminio"] as const;

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  abierto:       { bg: "bg-green-100",  text: "text-green-800",  dot: "bg-green-500",  label: "Abierto" },
  alta_demanda:  { bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500", label: "Alta demanda" },
  lleno:         { bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500", label: "Lleno" },
  mantenimiento: { bg: "bg-gray-100",   text: "text-gray-600",   dot: "bg-gray-400",   label: "Mantenimiento" },
  cerrado:       { bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500",    label: "Cerrado" },
};

// ─── Componente ───────────────────────────────────────────────────────────────
const MapView = () => {
  const [filters, setFilters]   = useState<string[]>([]);
  const [view, setView]         = useState<"map" | "list">("map");
  const [query, setQuery]       = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);

  // ── Datos reales desde Supabase ───────────────────────────────────────────
  const { data: centers = [], isLoading } = useQuery({
    queryKey: ["centers"],
    queryFn: getCenters,
  });

  // ── Filtrado local ────────────────────────────────────────────────────────
  const filtered = (centers as any[]).filter((c) => {
    const matchMat  = filters.length === 0 ||
      filters.every((f) => (c.accepted_materials as string[])?.includes(f));
    const matchQ    = !query ||
      (c.name + c.district + c.address).toLowerCase().includes(query.toLowerCase());
    const matchOpen = !onlyOpen ||
      (c.status !== "cerrado" && c.status !== "mantenimiento");
    return matchMat && matchQ && matchOpen;
  });

  const toggle   = (m: string) =>
    setFilters((f) => (f.includes(m) ? f.filter((x) => x !== m) : [...f, m]));
  const clearAll = () => { setQuery(""); setFilters([]); setOnlyOpen(false); };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <MobileShell>
      <ScreenHeader
        title="Puntos de reciclaje"
        subtitle={`${filtered.length} puntos · Campus USIL La Molina`}
        showBell
      />

      <div className="px-5 pt-3 space-y-3">
        {/* ── Buscador ── */}
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar campus o tipo de material..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 rounded-2xl border border-gray-200 bg-white pl-10 text-sm shadow-none"
          />
        </div>

        {/* ── Chips: Solo disponibles + materiales ── */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-5 px-5">
          <button
            onClick={() => setOnlyOpen((v) => !v)}
            className={`flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-smooth ${
              onlyOpen
                ? "bg-primary border-transparent text-white"
                : "bg-white border-gray-200 text-gray-700"
            }`}
          >
            🟢 Solo disponibles
          </button>

          {MATERIAL_KEYS.map((m) => {
            const meta   = MATERIAL_META[m];
            const active = filters.includes(m);
            return (
              <button
                key={m}
                onClick={() => toggle(m)}
                className={`flex-shrink-0 whitespace-nowrap flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-smooth ${
                  active
                    ? "bg-primary/15 border-primary text-primary"
                    : "bg-white border-gray-200 text-gray-700"
                }`}
              >
                <span>{meta.emoji}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Toggle mapa / lista ── */}
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

      {/* ── Vista mapa — La Molina ── */}
      {view === "map" && (
        <div
          className="relative mx-5 mt-4 h-[340px] overflow-hidden rounded-3xl border border-border shadow-card"
          style={{ background: "hsl(150 25% 95%)" }}
        >
          {/* SVG con calles reales de La Molina */}
          <svg
            viewBox="0 0 400 400"
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
          >
            {/* Av. La Fontana — horizontal y=55% (220px) */}
            <line x1="0" y1="220" x2="400" y2="220"
              stroke="hsl(210 20% 82%)" strokeWidth="22" />
            {/* Av. Raúl Ferrero — vertical x=35% (140px) */}
            <line x1="140" y1="0" x2="140" y2="400"
              stroke="hsl(210 20% 82%)" strokeWidth="18" />
            {/* Calle Los Fresnos — horizontal y=75% (300px) */}
            <line x1="0" y1="300" x2="400" y2="300"
              stroke="hsl(210 20% 82%)" strokeWidth="14" />
            {/* Etiqueta Av. La Fontana */}
            <text x="155" y="213" fontSize="9" fill="hsl(210 30% 45%)"
              fontFamily="sans-serif" fontWeight="600">
              Av. La Fontana
            </text>
            {/* Etiqueta Calle Los Fresnos */}
            <text x="150" y="294" fontSize="9" fill="hsl(210 30% 45%)"
              fontFamily="sans-serif" fontWeight="600">
              C. Los Fresnos
            </text>
          </svg>

          {/* Punto del usuario — centro (50%, 50%) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative flex items-center justify-center">
              <div className="absolute h-8 w-8 animate-ping rounded-full bg-blue-400/40" />
              <div className="h-4 w-4 rounded-full bg-blue-500 ring-2 ring-white shadow-lg" />
            </div>
          </div>

          {/* Pin SL01 — Av. La Fontana 550 */}
          <div
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{ left: "38%", top: "42%" }}
          >
            <div className="flex flex-col items-center gap-0.5">
              <div className="rounded-xl bg-white px-2 py-0.5 text-[10px] font-bold shadow-md whitespace-nowrap">
                SL01
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                <MapPin className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Pin SL02 — Av. La Fontana 750 */}
          <div
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{ left: "62%", top: "48%" }}
          >
            <div className="flex flex-col items-center gap-0.5">
              <div className="rounded-xl bg-white px-2 py-0.5 text-[10px] font-bold shadow-md whitespace-nowrap">
                SL02
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                <MapPin className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Footer mapa */}
          <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium shadow-card backdrop-blur">
            📍 La Molina, Lima · Campus USIL
          </div>
        </div>
      )}

      {/* ── Vista lista ── */}
      <section className="px-5 pt-4 space-y-3">
        {/* Skeletons — 2 centros */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        )}

        {/* Lista de centros */}
        {!isLoading && filtered.map((c) => {
          const s = STATUS_STYLES[c.status] ?? STATUS_STYLES["cerrado"];
          return (
            <Link
              key={c.id}
              to={`/app/center/${c.id}`}
              className="block rounded-2xl bg-card p-4 shadow-soft transition-bounce hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {/* Nombre + estado */}
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate font-display text-base font-bold">{c.name}</h4>
                    {c.is_mobile && (
                      <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[9px] font-bold text-secondary">
                        📡 MÓVIL
                      </span>
                    )}
                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.bg} ${s.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                      {s.label}
                    </span>
                  </div>

                  {/* Dirección */}
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {c.district} · {c.address}
                  </p>

                  {/* Chips de materiales inline */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(c.accepted_materials as string[])?.map((m) => {
                      const meta = MATERIAL_META[m];
                      return (
                        <span
                          key={m}
                          className="flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-700"
                        >
                          {meta?.emoji ?? "♻️"} {meta?.label ?? m}
                        </span>
                      );
                    })}
                  </div>

                  {/* Barra de capacidad */}
                  {c.status !== "mantenimiento" && c.status !== "cerrado" && (
                    <div className="mt-2 flex items-center gap-3 text-[11px]">
                      <span className="text-muted-foreground">Capacidad</span>
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${
                            c.capacity > 80 ? "bg-orange-400" : c.capacity > 60 ? "bg-yellow-400" : "bg-green-500"
                          }`}
                          style={{ width: `${c.capacity}%` }}
                        />
                      </div>
                      <span className="font-semibold text-muted-foreground">{c.capacity}%</span>
                    </div>
                  )}
                </div>

                {/* Rating + espera */}
                <div className="shrink-0 text-right">
                  <div className="flex items-center justify-end gap-1 text-xs font-semibold text-gray-700">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    {c.rating}
                  </div>
                  <p className="mt-1 font-display text-lg font-extrabold text-primary">
                    {c.wait_minutes}
                    <span className="text-xs font-normal">min</span>
                  </p>
                  <div className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> espera
                  </div>
                </div>
              </div>
            </Link>
          );
        })}

        {/* Empty state */}
        {!isLoading && filtered.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
            <MapPin className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="font-semibold text-gray-700">Sin resultados</p>
            <p className="mt-1 text-sm text-gray-500">Prueba con otros filtros</p>
            <button
              onClick={clearAll}
              className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-bold text-white"
            >
              Limpiar filtros
            </button>
          </div>
        )}

        {/* Banner offline */}
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <WifiOff className="h-4 w-4" />
          <span>
            <strong>Modo offline:</strong> los últimos centros siguen disponibles sin conexión.
          </span>
        </div>
      </section>
    </MobileShell>
  );
};

export default MapView;
