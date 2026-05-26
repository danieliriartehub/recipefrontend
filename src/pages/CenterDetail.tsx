import { useParams, Link } from "react-router-dom";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { CENTERS, STATUS_META } from "@/data/mock";
import { MaterialChip } from "@/components/recipe/MaterialChip";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Navigation, Phone, Share2, Star, Users, AlertCircle, CheckCircle2 } from "lucide-react";

const CenterDetail = () => {
  const { id } = useParams();
  const center = CENTERS.find((c) => c.id === id) ?? CENTERS[0];
  const s = STATUS_META[center.status];
  const closed = center.status === "cerrado" || center.status === "mantenimiento";

  const instructions = [
    "Separa los materiales por tipo (plástico, papel, vidrio, aluminio).",
    "Enjuaga botellas y envases para evitar olores.",
    "Aplasta las botellas para optimizar espacio.",
    "Lleva tu QR personal listo para validar la entrega.",
  ];

  return (
    <MobileShell>
      <ScreenHeader title="Centro de acopio" back />

      <div className="px-5 space-y-4">
        {/* Map preview */}
        <div className="relative h-40 overflow-hidden rounded-3xl border border-border shadow-card">
          <div className="absolute inset-0 bg-[hsl(150_30%_94%)]">
            <svg viewBox="0 0 400 200" className="absolute inset-0 h-full w-full">
              <defs>
                <pattern id="g2" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="hsl(150 25% 86%)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="400" height="200" fill="url(#g2)" />
              <path d="M0,90 Q150,60 250,110 T400,80" stroke="hsl(152 65% 38%)" strokeWidth="3" fill="none" strokeDasharray="6 6" />
            </svg>
          </div>
          <div className="absolute left-6 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 rounded-full bg-secondary ring-4 ring-white" />
            <p className="mt-1 text-[10px] font-bold">Tú</p>
          </div>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-glow ${s.dot}`}>
              <MapPin className="h-5 w-5" />
            </div>
            <p className="mt-1 text-[10px] font-bold">{center.name.split(" ")[0]}</p>
          </div>
        </div>

        {/* Header card */}
        <div className="rounded-3xl bg-card p-5 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-extrabold">{center.name}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{center.address}, {center.district}</p>
            </div>
            <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${s.bg} ${s.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${s.dot} animate-pulse`} />
              {s.label}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-3 divide-x divide-border rounded-2xl bg-muted/50 py-3 text-center">
            <div>
              <p className="font-display text-lg font-extrabold text-primary">{center.distanceKm} km</p>
              <p className="text-[11px] text-muted-foreground">Distancia</p>
            </div>
            <div>
              <p className="font-display text-lg font-extrabold text-primary">{center.etaMin} min</p>
              <p className="text-[11px] text-muted-foreground">A pie</p>
            </div>
            <div>
              <p className="flex items-center justify-center gap-1 font-display text-lg font-extrabold text-primary">
                <Star className="h-4 w-4 fill-accent text-accent" /> {center.rating}
              </p>
              <p className="text-[11px] text-muted-foreground">Reseñas</p>
            </div>
          </div>
        </div>

        {/* Real-time operational status */}
        {!closed && (
          <div className="rounded-3xl bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold">Estado en vivo</h3>
              <span className="flex items-center gap-1 text-[10px] font-bold text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> en tiempo real
              </span>
            </div>
            <div className="mt-3 space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold">Capacidad actual</span>
                  <span className="text-muted-foreground">{center.capacity}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full ${center.capacity > 80 ? "bg-orange-500" : center.capacity > 60 ? "bg-accent" : "bg-success"}`}
                    style={{ width: `${center.capacity}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span><strong>~{center.waitMin} min</strong> de espera</span>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-muted/50 p-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Cierra en <strong>3h 20m</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {closed && (
          <div className="flex items-start gap-3 rounded-3xl border-2 border-dashed border-destructive/30 bg-destructive/5 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
            <div className="text-sm">
              <p className="font-bold text-destructive">Este punto no recibe entregas hoy</p>
              <p className="mt-1 text-muted-foreground">Te recomendamos <Link to="/app/map" className="font-bold text-primary">ver otros puntos cercanos</Link> o esperar a la próxima campaña móvil.</p>
            </div>
          </div>
        )}

        {/* Materials */}
        <div className="rounded-3xl bg-card p-5 shadow-soft">
          <h3 className="mb-3 font-display text-base font-bold">Materiales aceptados</h3>
          <div className="flex flex-wrap gap-2">
            {center.materials.map((m) => <MaterialChip key={m} material={m} />)}
          </div>
        </div>

        {/* Quick instructions */}
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

        {/* Hours */}
        <div className="rounded-3xl bg-card p-5 shadow-soft">
          <h3 className="mb-2 font-display text-base font-bold">Horario y contacto</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3"><Clock className="h-4 w-4 text-primary" /> {center.hours}</div>
            <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary" /> +51 987 654 321</div>
            <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-primary" /> {center.address}</div>
          </div>
        </div>

        {/* CTAs */}
        <div className="grid grid-cols-2 gap-3 pt-1 pb-2">
          <Button variant="outline" size="lg" className="h-13 rounded-2xl border-2 font-semibold">
            <Share2 className="mr-2 h-4 w-4" /> Compartir
          </Button>
          <Button asChild size="lg" disabled={closed} className="h-13 rounded-2xl bg-gradient-primary font-semibold shadow-glow disabled:opacity-60">
            <Link to="/app/qr"><Navigation className="mr-2 h-4 w-4" /> Iniciar entrega</Link>
          </Button>
        </div>
      </div>
    </MobileShell>
  );
};

export default CenterDetail;
