import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getActiveBanners } from "@/lib/api";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { X } from "lucide-react";

export const GlobalRandomAd = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<any>(null);

  const { data: banners = [] } = useQuery({
    queryKey: ["activeBanners"],
    queryFn: getActiveBanners,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    // Solo mostrar en rutas protegidas y que no sean la raiz si no hay sesión
    if (!location.pathname.startsWith('/app')) return;
    
    // Ignoramos la carga inicial en /app porque allí ya sale el SessionBannerModal
    // Podemos llevar un conteo de movimientos en sessionStorage
    const moves = parseInt(sessionStorage.getItem("ui_moves") || "0");
    sessionStorage.setItem("ui_moves", (moves + 1).toString());

    // Mostrar el pop-up a partir del segundo movimiento
    if (moves > 0 && banners.length > 0) {
      // Elegir banner aleatorio
      const randomBanner = banners[Math.floor(Math.random() * banners.length)];
      setCurrentBanner(randomBanner);
      setIsOpen(true);
    }
  }, [location.pathname, banners.length]);

  if (!currentBanner) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none [&>button]:hidden z-[100]">
        {/* Usamos VisuallyHidden para el Title y Description exigidos por accesibilidad */}
        <DialogTitle className="sr-only">Anuncio de Aliado</DialogTitle>
        <DialogDescription className="sr-only">Publicidad de un aliado de Recipe</DialogDescription>
        
        <div className="relative group animate-in zoom-in-95 duration-300">
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 z-50 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 backdrop-blur-sm transition-all"
            aria-label="Cerrar anuncio"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xl border border-white/20">
            <div className="px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-transparent border-b flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Patrocinado
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">Publicidad</span>
            </div>
            
            {currentBanner.link_url || currentBanner.website_url ? (
              <a href={currentBanner.link_url || currentBanner.website_url} target="_blank" rel="noopener noreferrer" className="block w-full overflow-hidden" onClick={() => setIsOpen(false)}>
                <img 
                  src={currentBanner.banner_url} 
                  alt={currentBanner.title || currentBanner.business_name} 
                  className="w-full aspect-[4/3] object-cover hover:scale-105 transition-transform duration-700" 
                />
              </a>
            ) : (
              <div className="w-full overflow-hidden">
                <img 
                  src={currentBanner.banner_url} 
                  alt={currentBanner.title || currentBanner.business_name} 
                  className="w-full aspect-[4/3] object-cover hover:scale-105 transition-transform duration-700" 
                />
              </div>
            )}
            
            <div className="p-5 bg-white">
              <h3 className="font-bold text-lg mb-1.5 text-slate-800 leading-tight">
                {currentBanner.title || currentBanner.business_name}
              </h3>
              <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                ¡Aprovecha tus Puntos ECO para obtener beneficios exclusivos con nuestros aliados!
              </p>
              {(currentBanner.link_url || currentBanner.website_url) && (
                <a 
                  href={currentBanner.link_url || currentBanner.website_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={() => setIsOpen(false)} 
                  className="mt-4 flex items-center justify-center w-full bg-emerald-500 text-white py-2.5 rounded-xl font-semibold hover:bg-emerald-600 active:scale-95 transition-all shadow-sm shadow-emerald-500/20"
                >
                  Ver oferta ahora
                </a>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
