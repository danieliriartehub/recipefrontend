import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { MaterialChip } from "@/components/recipe/MaterialChip";
import { Button } from "@/components/ui/button";
import {
  AlertCircle, CheckCircle2, Clock, MapPin,
  Navigation, Phone, Star, Users,
} from "lucide-react";
import { toast } from "sonner";
import { getCenterById } from "@/lib/api";

// ─── Estado de centros — sin mock ────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  abierto:       { label: "Abierto",       bg: "bg-green-100",  text: "text-green-800",  dot: "bg-green-500" },
  alta_demanda:  { label: "Alta demanda",  bg: "bg-yellow-100", text: "text-yellow-800", dot: "bg-yellow-500" },
  lleno:         { label: "Lleno",         bg: "bg-orange-100", text: "text-orange-800", dot: "bg-orange-500" },
  mantenimiento: { label: "Mantenimiento", bg: "bg-gray-100",   text: "text-gray-700",   dot: "bg-gray-400" },
  cerrado:       { label: "Cerrado",       bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500" },
};

const instructions = [
  "Separa los materiales por tipo (plástico, papel, vidrio, aluminio).",
  "Enjuaga botellas y envases para evitar olores.",
  "Aplasta las botellas para optimizar espacio.",
  "Lleva tu QR personal listo para validar la entrega.",
];

// ─── Skeleton reutilizable ────────────────────────────────────────────────────
const Sk = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-3xl bg-gray-100 ${className}`} />
);

// ─── Componente ───────────────────────────────────────────────────────────────
const CenterDetail = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();

  const { data: center, isLoading, isError } = useQuery({
    queryKey: ["center", id],
    queryFn:  () => getCenterById(id!),
    enabled:  !!id,
  });

  const s      = STATUS_META[(center as any)?.status ?? "cerrado"];
  const closed = (center as any)?.status === "cerrado" ||
                 (center as any)?.status === "mantenimiento";

  // ── Web Share API ─────────────────────────────────────────────────────────
  const handleShare = async () => {
    if (!center) return;
    const c = center as any;
    if (navigator.share) {
      await navigator.share({
        title: c.name,
        text:  `Centro de reciclaje USIL: ${c.name}`,
        url:   window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Enlace copiado al portapapeles");
    }
  };

  // ── Ver ruta en Google Maps ────────────────────────────────────────────────
  const handleVerRuta = () => {
    const c = center as any;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`;
    window.open(url, "_blank");
  };

  // ─── Error ────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <MobileShell>
        <ScreenHeader title="Centro de acopio" back />
        <div className="px-5 py-10 text-center space-y-3">

          <p className="font-semibold text-destructive">
            No se pudo cargar el centro.
          </p>
          <button
            onClick={() => navigate("/app/map")}
            className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-white"
          >
            Volver al mapa
          </button>
        </div>
      </MobileShell>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  const c = center as any;

  return (
    <MobileShell>
      <ScreenHeader
        title="Centro de acopio"
        back
        onShare={center ? handleShare : undefined}
      />

      <div className="px-5 space-y-4">

        {/* ── Mapa preview — La Molina ── */}
        <div
          className="relative h-40 overflow-hidden rounded-3xl border border-border shadow-card"
          style={{ background: "hsl(150 25% 95%)" }}
        >
          <svg viewBox="0 0 400 200" className="absolute inset-0 h-full w-full">
            {/* Av. La Fontana */}
            <line x1="0" y1="95" x2="400" y2="105"
              stroke="hsl(210 20% 82%)" strokeWidth="20" />
            {/* Calle transversal */}
            <line x1="200" y1="0" x2="210" y2="200"
              stroke="hsl(210 20% 82%)" strokeWidth="14" />
            <text x="55" y="88" fontSize="9" fill="hsl(210 30% 45%)"
              fontFamily="sans-serif" fontWeight="600">
              Av. La Fontana
            </text>
          </svg>

          {/* Punto usuario */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute h-6 w-6 animate-ping rounded-full bg-blue-400/40" />
              <div className="h-3 w-3 rounded-full bg-blue-500 ring-2 ring-white" />
            </div>
            <p className="mt-1 text-[10px] font-bold text-gray-600">Tú</p>
          </div>

          {/* Pin del centro */}
          <div className="absolute right-8 top-1/2 -translate-y-full flex flex-col items-center">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-lg ${s.dot}`}>
              <MapPin className="h-5 w-5" />
            </div>
            <p className="mt-1 text-[10px] font-bold text-gray-700 max-w-[60px] truncate text-center">
              {isLoading ? "—" : c?.name?.split(" ")[0]}
            </p>
          </div>

          <div className="absolute bottom-2 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-medium shadow backdrop-blur">
            📍 La Molina · Campus USIL
          </div>
        </div>

        {/* ── Header card ── */}
        {isLoading ? (
          <Sk className="h-40" />
        ) : (
          <div className="rounded-3xl bg-card p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-display text-xl font-extrabold break-words">{c.name}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {c.address}, {c.district}
                </p>
              </div>
              <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.bg} ${s.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${s.dot} animate-pulse`} />
                {s.label}
              </span>
            </div>

            {/* Grid métricas — Fix 1 */}
            <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-2xl bg-muted/50 py-3 text-center">
              <div>
                <p className="font-display text-base font-extrabold text-primary">
                  {c.wait_minutes}
                  <span className="text-xs font-normal"> min</span>
                </p>
                <p className="text-[11px] text-muted-foreground">Espera est.</p>
              </div>
              <div>
                <p className="font-display text-base font-extrabold text-primary">
                  {c.capacity}
                  <span className="text-xs font-normal">%</span>
                </p>
                <p className="text-[11px] text-muted-foreground">Capacidad</p>
              </div>
              <div>
                <p className="flex items-center justify-center gap-1 font-display text-base font-extrabold text-primary">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> {c.rating}
                </p>
                <p className="text-[11px] text-muted-foreground">Valoración</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Estado en vivo ── */}
        {isLoading ? (
          <Sk className="h-28" />
        ) : !closed ? (
          <div className="rounded-3xl bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold">Estado en vivo</h3>
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                en tiempo real
              </span>
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold">Capacidad actual</span>
                  <span className="text-muted-foreground">{c.capacity}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${
                      c.capacity > 80 ? "bg-orange-500" : c.capacity > 60 ? "bg-yellow-400" : "bg-green-500"
                    }`}
                    style={{ width: `${c.capacity}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span><strong>~{c.wait_minutes} min</strong> de espera</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-xs">{c.hours}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-3xl border-2 border-dashed border-destructive/30 bg-destructive/5 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
            <div className="text-sm">
              <p className="font-bold text-destructive">Este punto no recibe entregas hoy</p>
              <p className="mt-1 text-muted-foreground">
                Te recomendamos{" "}
                <Link to="/app/map" className="font-bold text-primary">
                  ver otros puntos cercanos
                </Link>{" "}
                o esperar a la próxima campaña móvil.
              </p>
            </div>
          </div>
        )}

        {/* ── Materiales aceptados ── */}
        {isLoading ? (
          <Sk className="h-20" />
        ) : (
          <div className="rounded-3xl bg-card p-5 shadow-soft">
            <h3 className="mb-3 font-display text-base font-bold">Materiales aceptados</h3>
            <div className="flex flex-wrap gap-2">
              {(c.accepted_materials as string[])?.map((m) => (
                <MaterialChip key={m} material={m as any} />
              ))}
            </div>
          </div>
        )}

        {/* ── Instrucciones ── */}
        <div className="rounded-3xl bg-card p-5 shadow-soft">
          <h3 className="mb-3 font-display text-base font-bold">Cómo preparar tu entrega</h3>
          <ul className="space-y-2 text-sm">
            {instructions.map((t, i) => (
              <li key={i} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-primary" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Horario y contacto ── */}
        {isLoading ? (
          <Sk className="h-24" />
        ) : (
          <div className="rounded-3xl bg-card p-5 shadow-soft">
            <h3 className="mb-2 font-display text-base font-bold">Horario y contacto</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-primary" />
                {c.hours}
              </div>
              <a
                href="tel:+5117080000"
                className="flex items-center gap-3 text-sm text-primary font-medium"
              >
                <Phone className="h-4 w-4 text-primary" />
                Central USIL: (01) 708-0000
              </a>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-primary" />
                {c.address}, {c.district}
              </div>
            </div>
          </div>
        )}

        {/* ── CTAs ── */}
        <div className="grid grid-cols-2 gap-3 pt-1 pb-2">
          <Button
            variant="outline"
            size="lg"
            className="h-13 rounded-2xl border-2 font-semibold"
            onClick={handleVerRuta}
            disabled={isLoading || !c?.lat || !c?.lng}
            title={(!c?.lat || !c?.lng) ? "Ubicación no disponible" : undefined}
          >
            <Navigation className="mr-2 h-4 w-4" /> Ver ruta
          </Button>
          <Button
            asChild
            size="lg"
            disabled={closed || isLoading}
            className="h-13 rounded-2xl bg-gradient-primary font-semibold shadow-glow disabled:opacity-60"
          >
            <Link to="/app/qr">
              <Navigation className="mr-2 h-4 w-4" /> Iniciar entrega
            </Link>
          </Button>
        </div>

      </div>
    </MobileShell>
  );
};

export default CenterDetail;
