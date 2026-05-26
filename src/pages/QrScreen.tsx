import { useState } from "react";
import { Link } from "react-router-dom";
import { MobileShell } from "@/components/recipe/MobileShell";
import { ScreenHeader } from "@/components/recipe/ScreenHeader";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Download, Share2, ShieldCheck, Check, Wallet as WalletIcon } from "lucide-react";

const QrSvg = ({ seed = "RECIPE" }: { seed?: string }) => {
  const size = 25;
  const cells: boolean[][] = [];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let r = 0; r < size; r++) {
    cells[r] = [];
    for (let c = 0; c < size; c++) {
      h = (h * 1664525 + 1013904223) >>> 0;
      cells[r][c] = (h & 7) > 3;
    }
  }
  const drawFinder = (r: number, c: number) => {
    for (let i = 0; i < 7; i++)
      for (let j = 0; j < 7; j++) {
        const edge = i === 0 || i === 6 || j === 0 || j === 6;
        const inner = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        cells[r + i][c + j] = edge || inner;
      }
  };
  drawFinder(0, 0); drawFinder(0, size - 7); drawFinder(size - 7, 0);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
      <rect width={size} height={size} fill="white" />
      {cells.flatMap((row, r) =>
        row.map((on, c) =>
          on ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="hsl(160 25% 12%)" rx={0.15} /> : null
        )
      )}
    </svg>
  );
};

const QrScreen = () => {
  const { profile } = useAuth();
  const [validated, setValidated] = useState(false);

  const fullName  = profile?.full_name    ?? "Usuario";
  const username  = profile?.username     ?? null;
  const points    = profile?.points       ?? 0;
  const qrCode    = profile?.qr_code      ?? `RECIPE-${(profile?.id ?? "NEW").slice(0, 8).toUpperCase()}`;

  return (
    <MobileShell>
      <ScreenHeader title="Mi código QR" subtitle="Validación instantánea con recompensa" back />

      <div className="px-5">
        <div className="rounded-[28px] bg-gradient-hero p-1 shadow-float">
          <div className="rounded-[24px] bg-card p-6">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">RECIPE · QR personal</p>
              <h2 className="mt-1 font-display text-2xl font-extrabold">{fullName}</h2>
              <p className="text-sm text-muted-foreground">
                {username ? `${username} · ` : ""}{points} pts
              </p>
            </div>

            <div className="relative mx-auto mt-5 aspect-square w-full max-w-[260px] overflow-hidden rounded-2xl border-4 border-primary/20 p-3 bg-white">
              <QrSvg seed={qrCode} />
              {validated && (
                <div className="absolute inset-0 flex items-center justify-center bg-success/95 animate-scale-in">
                  <div className="text-center text-success-foreground">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                      <Check className="h-10 w-10" strokeWidth={3} />
                    </div>
                    <p className="mt-3 font-display text-xl font-extrabold">¡Validado!</p>
                    <p className="text-sm">+60 EcoPuntos</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 rounded-full bg-success/10 py-2 text-success">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-bold">Código verificado · Actualiza cada 60s</span>
            </div>

            <div className="mt-3 rounded-2xl bg-muted/60 py-2 text-center font-mono text-sm tracking-wider">
              {qrCode}
            </div>
          </div>
        </div>

        {/* Demo simulate validation */}
        <Button
          onClick={() => { setValidated(true); setTimeout(() => setValidated(false), 3500); }}
          size="lg"
          className="mt-4 h-12 w-full rounded-2xl bg-gradient-primary font-bold shadow-glow"
        >
          ✨ Simular validación instantánea
        </Button>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Button variant="outline" size="lg" className="h-12 rounded-2xl border-2 font-semibold">
            <Share2 className="mr-2 h-4 w-4" /> Compartir
          </Button>
          <Button variant="outline" size="lg" className="h-12 rounded-2xl border-2 font-semibold">
            <Download className="mr-2 h-4 w-4" /> Guardar
          </Button>
        </div>

        {/* Acceso directo a Eco Wallet */}
        <Link
          to="/app/wallet"
          className="mt-6 flex items-center gap-3 rounded-3xl bg-card p-4 shadow-soft transition-bounce hover:-translate-y-0.5"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <WalletIcon className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="font-display text-base font-extrabold">Eco Wallet</p>
            <p className="text-xs text-muted-foreground">Ver historial de puntos</p>
          </div>
        </Link>
      </div>
    </MobileShell>
  );
};

export default QrScreen;
