import { NavLink, useLocation, Link } from "react-router-dom";
import { Home, Map, ShoppingBag, User, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

const itemsLeft = [
  { to: "/app",             icon: Home,        label: "Inicio" },
  { to: "/app/map",         icon: Map,         label: "Mapa" },
];

const itemsRight = [
  { to: "/app/marketplace", icon: ShoppingBag, label: "Market" },
  { to: "/app/profile",     icon: User,        label: "Perfil" },
];

export const BottomNav = () => {
  const { pathname } = useLocation();

  const renderItem = ({ to, icon: Icon, label }: any) => {
    const active = pathname === to || (to !== "/app" && pathname.startsWith(to));
    return (
      <li key={to} className="flex justify-center">
        <NavLink
          to={to}
          end={to === "/app"}
          className={cn(
            "flex flex-col items-center gap-1 rounded-xl py-2 w-full text-[11px] font-medium transition-smooth",
            active ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl transition-smooth",
            active && "bg-primary/10"
          )}>
            <Icon className={cn("h-5 w-5", active && "scale-110")} strokeWidth={active ? 2.4 : 2} />
          </span>
          <span className="truncate max-w-full px-1">{label}</span>
        </NavLink>
      </li>
    );
  };

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[440px] -translate-x-1/2">
      <div className="border-t border-border/60 bg-card/90 backdrop-blur-xl relative">
        {/* Botón QR sobresaliente en el centro */}
        <div className="absolute left-1/2 -top-5 -translate-x-1/2 z-20 flex flex-col items-center">
          <Link
            to="/app/qr"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow transition-transform hover:scale-105 active:scale-95 border-4 border-card/95"
          >
            <QrCode className="h-7 w-7" strokeWidth={2.5} />
          </Link>
          <span className="mt-1 text-[11px] font-medium text-muted-foreground">Mi QR</span>
        </div>

        <ul className="grid grid-cols-5 px-1 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 relative z-10">
          {itemsLeft.map(renderItem)}
          <li className="pointer-events-none" /> {/* Espacio central vacío para el QR */}
          {itemsRight.map(renderItem)}
        </ul>
      </div>
    </nav>
  );
};
