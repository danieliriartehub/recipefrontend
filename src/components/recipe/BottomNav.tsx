import { NavLink, useLocation } from "react-router-dom";
import { Home, Map, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/app",             icon: Home,        label: "Inicio" },
  { to: "/app/map",         icon: Map,         label: "Mapa" },
  { to: "/app/marketplace", icon: ShoppingBag, label: "Market" },
  { to: "/app/profile",     icon: User,        label: "Perfil" },
];

export const BottomNav = () => {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[440px] -translate-x-1/2">
      <div className="border-t border-border/60 bg-card/90 backdrop-blur-xl">
        <ul className="grid grid-cols-4 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2">
          {items.map(({ to, icon: Icon, label }) => {
            const active = pathname === to || (to !== "/app" && pathname.startsWith(to));
            return (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === "/app"}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-smooth",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-smooth",
                    active && "bg-primary/10"
                  )}>
                    <Icon className={cn("h-5 w-5", active && "scale-110")} strokeWidth={active ? 2.4 : 2} />
                  </span>
                  {label}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
