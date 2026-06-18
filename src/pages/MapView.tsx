import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import {
  Clock, MapPin, Search, List, Map as MapIcon, WifiOff, X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { getCenters } from "@/lib/api";

// ─── Constantes locales ────────────────────────────────────────────────────────

const MATERIAL_META: Record<string, { label: string; emoji: string }> = {
  plastico: { label: "Plástico", emoji: "🧴" },
  papel:    { label: "Papel",    emoji: "📄" },
  vidrio:   { label: "Vidrio",   emoji: "🍾" },
  aluminio: { label: "Aluminio", emoji: "🥫" },
};

const MATERIAL_KEYS = ["plastico", "papel", "vidrio", "aluminio"] as const;

const STATUS_STYLES: Record<string, {
  bg: string; text: string; dot: string; label: string; markerColor: string;
}> = {
  abierto:       { bg: "bg-green-100",  text: "text-green-800",  dot: "bg-green-500",  label: "Abierto",       markerColor: "#22c55e" },
  alta_demanda:  { bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500", label: "Alta demanda",   markerColor: "#eab308" },
  lleno:         { bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500", label: "Lleno",         markerColor: "#f97316" },
  mantenimiento: { bg: "bg-gray-100",   text: "text-gray-600",   dot: "bg-gray-400",   label: "Mantenimiento", markerColor: "#9ca3af" },
  cerrado:       { bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500",    label: "Cerrado",       markerColor: "#ef4444" },
};

// Centro por defecto USIL La Molina
const DEFAULT_CENTER: [number, number] = [-12.0783, -76.9341];
const DEFAULT_ZOOM = 15;

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

// ─── Loader de Leaflet (CDN) ──────────────────────────────────────────────────

let leafletPromise: Promise<any> | null = null;

function loadLeaflet(): Promise<any> {
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    // CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id  = "leaflet-css";
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    // JS — solo si no está cargado
    if ((window as any).L) {
      resolve((window as any).L);
      return;
    }
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.onload  = () => resolve((window as any).L);
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return leafletPromise;
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Center {
  id: string;
  name: string;
  district?: string;
  address?: string;
  lat: number;
  lng: number;
  status: string;
  accepted_materials: string[];
  hours?: string;
  wait_minutes?: number;
  capacity?: number;
  rating?: number;
  is_mobile?: boolean;
}

// ─── Componente InteractiveMap ────────────────────────────────────────────────

interface InteractiveMapProps {
  centers: Center[];
}

function InteractiveMap({ centers }: InteractiveMapProps) {
  const mapContainerRef  = useRef<HTMLDivElement>(null);
  const leafletMapRef    = useRef<any>(null);
  const markersLayerRef  = useRef<any>(null);
  const navigate         = useNavigate();
  const [leafletReady, setLeafletReady] = useState(false);

  // Inicializar mapa una sola vez
  useEffect(() => {
    let destroyed = false;
    loadLeaflet().then((L) => {
      if (destroyed || !mapContainerRef.current || leafletMapRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: true,
        scrollWheelZoom: true,
        tap: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      leafletMapRef.current = map;

      // Fix de tamaño para contenedores dinámicos
      setTimeout(() => map.invalidateSize(), 100);

      setLeafletReady(true);
    });

    return () => {
      destroyed = true;
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // Actualizar markers cuando cambian los centros filtrados
  useEffect(() => {
    if (!leafletReady || !leafletMapRef.current || !markersLayerRef.current) return;
    const L   = (window as any).L;
    const map = leafletMapRef.current;
    const layer = markersLayerRef.current;

    // Limpiar markers anteriores
    layer.clearLayers();

    if (centers.length === 0) return;

    const bounds: [number, number][] = [];

    centers.forEach((center) => {
      const status = STATUS_STYLES[center.status] ?? STATUS_STYLES["cerrado"];

      // SVG marker personalizado por color de estado
      const svgSize = 44;
      const svgMarker = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize + 10}" viewBox="0 0 44 54">
          <circle cx="22" cy="20" r="18" fill="${status.markerColor}" stroke="white" stroke-width="3"
            style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35))"/>
          <text x="22" y="26" text-anchor="middle" font-size="15">♻️</text>
          <polygon points="22,52 14,30 30,30" fill="${status.markerColor}"/>
        </svg>`;

      const icon = L.divIcon({
        html: svgMarker,
        className: "",
        iconSize:   [svgSize, svgSize + 10],
        iconAnchor: [svgSize / 2, svgSize + 10],
        popupAnchor: [0, -(svgSize + 10)],
      });

      // Contenido del popup
      const materialsHtml = (center.accepted_materials || []).map((m) => {
        const meta = MATERIAL_META[m];
        return `<span style="display:inline-flex;align-items:center;gap:3px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:999px;padding:2px 7px;font-size:10px;font-weight:500;margin:2px;">
          ${meta?.emoji ?? "♻️"} ${meta?.label ?? m}
        </span>`;
      }).join("");

      const popupHtml = `
        <div style="font-family:system-ui,sans-serif;min-width:200px;max-width:240px;padding:2px;">
          <div style="display:flex;align-items:flex-start;gap:6px;margin-bottom:6px;">
            <strong style="font-size:13px;flex:1;line-height:1.3;">${center.name}</strong>
            ${center.is_mobile ? '<span style="font-size:9px;background:#d1fae5;color:#065f46;border-radius:999px;padding:1px 6px;white-space:nowrap;flex-shrink:0;">📡 MÓVIL</span>' : ""}
          </div>

          <div style="display:flex;align-items:center;gap:5px;margin-bottom:5px;">
            <span style="width:8px;height:8px;border-radius:50%;background:${status.markerColor};display:inline-block;flex-shrink:0;"></span>
            <span style="font-size:11px;color:${status.markerColor};font-weight:600;">${status.label}</span>
          </div>

          ${center.address ? `<p style="font-size:11px;color:#6b7280;margin:0 0 4px;">${center.district ? center.district + " · " : ""}${center.address}</p>` : ""}
          ${center.wait_minutes !== undefined ? `<p style="font-size:11px;color:#6b7280;margin:0 0 6px;">⏱ ${center.wait_minutes} min de espera</p>` : ""}

          <div style="display:flex;flex-wrap:wrap;gap:2px;margin-bottom:10px;">${materialsHtml}</div>

          <button
            data-center-id="${center.id}"
            onclick="window.__recipeNavigate && window.__recipeNavigate('/app/center/${center.id}')"
            style="display:block;width:100%;text-align:center;background:#16a34a;color:white;border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:600;cursor:pointer;"
          >
            Ver detalle →
          </button>
        </div>`;

      const marker = L.marker([center.lat, center.lng], { icon })
        .bindPopup(popupHtml, { maxWidth: 260, className: "recipe-popup" });

      layer.addLayer(marker);
      bounds.push([center.lat, center.lng]);
    });

    // Registrar función de navegación en window para el botón del popup
    (window as any).__recipeNavigate = (path: string) => navigate(path);

    // Ajustar vista para mostrar todos los markers
    if (bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 16);
      } else {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17 });
      }
    }
  }, [centers, leafletReady, navigate]);

  return (
    <div className="relative mx-5 mt-4 overflow-hidden rounded-3xl border border-border shadow-card" style={{ height: 340 }}>
      {/* Contenedor del mapa */}
      <div
        ref={mapContainerRef}
        id="recipe-leaflet-map"
        style={{ height: "100%", width: "100%", borderRadius: "1.5rem", zIndex: 0 }}
      />

      {/* Skeleton mientras carga Leaflet */}
      {!leafletReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 rounded-3xl">
          <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-3" />
          <p className="text-sm text-gray-500 font-medium">Cargando mapa...</p>
        </div>
      )}

      {/* Empty state overlay */}
      {leafletReady && centers.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm rounded-3xl pointer-events-none">
          <MapPin className="h-9 w-9 text-gray-300 mb-2" />
          <p className="text-sm font-semibold text-gray-600">Sin centros en el mapa</p>
          <p className="text-xs text-gray-400 mt-1">Ajusta los filtros</p>
        </div>
      )}

      {/* Leyenda de estados */}
      {leafletReady && (
        <div className="absolute bottom-3 left-3 rounded-2xl bg-white/95 px-3 py-2 shadow-card backdrop-blur pointer-events-none" style={{ zIndex: 500 }}>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-1">Estado</p>
          {(["abierto", "alta_demanda", "cerrado"] as const).map((key) => {
            const val = STATUS_STYLES[key];
            return (
              <div key={key} className="flex items-center gap-1.5 mb-0.5">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: val.markerColor }} />
                <span className="text-[10px] text-gray-600">{val.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Badge contador de pins */}
      {leafletReady && (
        <div
          className="absolute top-3 right-3 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow-md"
          style={{ zIndex: 500 }}
        >
          {centers.length} punto{centers.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal MapView ─────────────────────────────────────────────

const MapView = () => {
  const [filters, setFilters]   = useState<string[]>([]);
  const [view, setView]         = useState<"map" | "list">("map");
  const [query, setQuery]       = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);

  // ── Datos reales desde la API ──────────────────────────────────────────────
  const { data: centers = [], isLoading } = useQuery({
    queryKey: ["centers"],
    queryFn: getCenters,
  });

  // ── Filtrado reactivo ──────────────────────────────────────────────────────
  const filtered = (centers as Center[]).filter((c) => {
    const matchMat  = filters.length === 0 ||
      filters.every((f) => (c.accepted_materials as string[])?.includes(f));
    const matchQ    = !query ||
      (c.name + (c.district ?? "") + (c.address ?? "")).toLowerCase().includes(query.toLowerCase());
    const matchOpen = !onlyOpen ||
      (c.status !== "cerrado" && c.status !== "mantenimiento");
    return matchMat && matchQ && matchOpen;
  });

  const toggle   = (m: string) =>
    setFilters((f) => (f.includes(m) ? f.filter((x) => x !== m) : [...f, m]));
  const clearAll = useCallback(() => { setQuery(""); setFilters([]); setOnlyOpen(false); }, []);

  const activeFilterCount = filters.length + (onlyOpen ? 1 : 0) + (query ? 1 : 0);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <MobileShell>
      <ScreenHeader
        title="Puntos de reciclaje"
        subtitle={`${filtered.length} punto${filtered.length !== 1 ? "s" : ""} · Campus USIL`}
        back
      />

      <div className="px-5 pt-3 space-y-3">
        {/* ── Buscador ── */}
        <div className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
          <Input
            id="map-search-input"
            placeholder="Buscar campus o tipo de material..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 rounded-2xl border border-gray-200 bg-white pl-10 pr-10 text-sm shadow-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ── Chips filtros ── */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-5 px-5">
          <button
            id="filter-chip-disponibles"
            onClick={() => setOnlyOpen((v) => !v)}
            className={`flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
              onlyOpen
                ? "bg-primary border-transparent text-white shadow-sm"
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
                id={`filter-chip-${m}`}
                onClick={() => toggle(m)}
                className={`flex-shrink-0 whitespace-nowrap flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "bg-primary/15 border-primary text-primary shadow-sm"
                    : "bg-white border-gray-200 text-gray-700"
                }`}
              >
                <span>{meta.emoji}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}

          {activeFilterCount > 0 && (
            <button
              id="filter-clear-all"
              onClick={clearAll}
              className="flex-shrink-0 whitespace-nowrap flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-all"
            >
              <X className="h-3 w-3" />
              Limpiar ({activeFilterCount})
            </button>
          )}
        </div>

        {/* ── Toggle mapa / lista ── */}
        <div className="grid grid-cols-2 rounded-2xl bg-muted p-1">
          {(["map", "list"] as const).map((v) => {
            const Icon = v === "map" ? MapIcon : List;
            return (
              <button
                key={v}
                id={`view-toggle-${v}`}
                onClick={() => setView(v)}
                className={`flex items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition-all ${
                  view === v ? "bg-background shadow-soft text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" /> {v === "map" ? "Mapa" : "Lista"}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Vista mapa interactivo ── */}
      {view === "map" && !isLoading && (
        <InteractiveMap centers={filtered} />
      )}

      {/* Skeleton mapa mientras carga la API */}
      {view === "map" && isLoading && (
        <div className="relative mx-5 mt-4 h-[340px] overflow-hidden rounded-3xl border border-border bg-gray-100 animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-gray-400">Cargando centros...</p>
          </div>
        </div>
      )}

      {/* ── Vista lista ── */}
      <section className="px-5 pt-4 space-y-3 pb-6">
        {/* Skeletons */}
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
              id={`center-card-${c.id}`}
              className="block rounded-2xl bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-md"
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

                  {/* Chips materiales */}
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
                            (c.capacity ?? 0) > 80 ? "bg-orange-400" : (c.capacity ?? 0) > 60 ? "bg-yellow-400" : "bg-green-500"
                          }`}
                          style={{ width: `${c.capacity ?? 0}%` }}
                        />
                      </div>
                      <span className="font-semibold text-muted-foreground">{c.capacity ?? 0}%</span>
                    </div>
                  )}
                </div>

                {/* Tiempo de espera */}
                <div className="shrink-0 text-right">
                  <p className="font-display text-lg font-extrabold text-primary">
                    {c.wait_minutes ?? 0}
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
            <p className="mt-1 text-sm text-gray-500">Prueba con otros filtros o términos de búsqueda</p>
            <button
              id="empty-state-clear-btn"
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
