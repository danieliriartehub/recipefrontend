import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { MARKETPLACE, USER } from "@/data/mock";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle2, Package, Shield, Sparkles, Store, Tag } from "lucide-react";

const MarketplaceDetail = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const item = MARKETPLACE.find((m) => m.id === id);
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (!item) {
    return (
      <MobileShell>
        <ScreenHeader title="Recompensa" back />
        <div className="px-5 py-10 text-center text-sm text-muted-foreground">
          Recompensa no disponible.
          <div className="mt-4">
            <Button asChild><Link to="/app/marketplace">Volver al marketplace</Link></Button>
          </div>
        </div>
      </MobileShell>
    );
  }

  const canRedeem = USER.points >= item.cost;
  const remainingAfter = USER.points - item.cost;
  const stock = 8 + (item.cost % 12); // mock stock

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => {
      setOpen(false);
      setConfirmed(false);
      toast.success(`¡${item.title} canjeado!`, { description: "Tu cupón está en la wallet" });
      nav("/app/wallet");
    }, 1300);
  };

  return (
    <MobileShell>
      <ScreenHeader title="Detalle de recompensa" back />

      <div className="px-5 space-y-5 pb-6">
        {/* Hero image */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-soft shadow-card">
          <div className="flex h-56 items-center justify-center text-[120px]">{item.emoji}</div>
          {item.tag && (
            <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-[10px] font-extrabold uppercase text-accent-foreground shadow-soft">
              <Sparkles className="h-3 w-3" /> {item.tag}
            </span>
          )}
          <span className="absolute right-4 top-4 rounded-full bg-card/90 px-3 py-1 text-[10px] font-bold backdrop-blur">
            {item.category}
          </span>
        </div>

        {/* Title & price */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{item.brand}</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight">{item.title}</h1>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-primary">{item.cost.toLocaleString()}</span>
            <span className="text-sm font-bold text-muted-foreground">EcoPuntos</span>
          </div>
        </div>

        {/* Description */}
        <div className="rounded-3xl bg-card p-5 shadow-soft">
          <p className="font-display text-sm font-bold">Descripción</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetaCell icon={<Package className="h-4 w-4" />} label="Stock disponible" value={`${stock} unidades`} />
          <MetaCell icon={<Tag className="h-4 w-4" />} label="Categoría" value={item.category} />
          <MetaCell icon={<Store className="h-4 w-4" />} label="Comercio aliado" value={item.brand} />
          <MetaCell icon={<Shield className="h-4 w-4" />} label="Vigencia" value="30 días tras canje" />
        </div>

        {/* Conditions */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <p className="font-display text-sm font-bold">Condiciones</p>
          <ul className="mt-2 space-y-1.5 text-[12px] text-muted-foreground">
            <li>· Cupón personal e intransferible</li>
            <li>· Válido únicamente en sedes del comercio aliado</li>
            <li>· No acumulable con otras promociones</li>
            <li>· Presenta el QR del cupón al momento del canje</li>
          </ul>
        </div>

        {/* CTA */}
        <Button
          size="lg"
          disabled={!canRedeem}
          onClick={() => setOpen(true)}
          className={`h-14 w-full rounded-2xl text-base font-bold ${
            canRedeem ? "bg-gradient-primary shadow-glow" : "bg-muted text-muted-foreground"
          }`}
        >
          {canRedeem ? "Canjear recompensa" : `Te faltan ${(item.cost - USER.points).toLocaleString()} pts`}
        </Button>
      </div>

      {/* Confirm modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[360px] rounded-3xl border-0 p-0 overflow-hidden">
          {confirmed ? (
            <div className="flex flex-col items-center bg-gradient-hero p-8 text-center text-primary-foreground animate-scale-in">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                <CheckCircle2 className="h-12 w-12" strokeWidth={2.5} />
              </div>
              <p className="mt-4 font-display text-xl font-extrabold">¡Canje confirmado!</p>
              <p className="mt-1 text-sm opacity-90">Tu cupón se envió a la wallet</p>
            </div>
          ) : (
            <>
              <div className="bg-gradient-soft p-6 text-center">
                <div className="text-6xl">{item.emoji}</div>
                <DialogHeader className="mt-3">
                  <DialogTitle className="font-display text-lg font-extrabold">Confirmar canje</DialogTitle>
                  <DialogDescription className="text-xs">
                    Estás a punto de canjear esta recompensa con tus EcoPuntos.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="space-y-3 px-6 py-5">
                <Row label="Recompensa" value={item.title} />
                <Row label="Comercio" value={item.brand} />
                <div className="border-t border-dashed border-border pt-3">
                  <Row label="Saldo actual" value={`${USER.points.toLocaleString()} pts`} />
                  <Row label="Costo" value={`− ${item.cost.toLocaleString()} pts`} highlight />
                  <Row label="Saldo restante" value={`${remainingAfter.toLocaleString()} pts`} strong />
                </div>
                <div className="rounded-2xl bg-primary/5 p-3 text-center text-[11px] font-semibold text-primary">
                  🌱 Tu canje financia 1 acción de reforestación
                </div>
              </div>

              <DialogFooter className="grid grid-cols-2 gap-2 px-6 pb-6">
                <Button variant="outline" onClick={() => setOpen(false)} className="h-12 rounded-xl font-bold">
                  Cancelar
                </Button>
                <Button onClick={handleConfirm} className="h-12 rounded-xl bg-gradient-primary font-bold shadow-glow">
                  Confirmar canje
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </MobileShell>
  );
};

const MetaCell = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-2xl bg-card p-3 shadow-soft">
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</span>
    <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="text-sm font-bold">{value}</p>
  </div>
);

const Row = ({ label, value, strong, highlight }: { label: string; value: string; strong?: boolean; highlight?: boolean }) => (
  <div className="flex items-center justify-between text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={`${strong ? "font-display text-base font-extrabold text-primary" : "font-bold"} ${highlight ? "text-destructive" : ""}`}>{value}</span>
  </div>
);

export default MarketplaceDetail;
