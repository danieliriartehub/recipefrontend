import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Welcome from "./pages/Welcome";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import MapView from "./pages/MapView";
import CenterDetail from "./pages/CenterDetail";
import QrScreen from "./pages/QrScreen";
import Simulator from "./pages/Simulator";
import Impact from "./pages/Impact";
import { Navigate } from "react-router-dom";
import MarketplaceDetail from "./pages/MarketplaceDetail";
import Coupons from "./pages/Coupons";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import ScanAI from "./pages/ScanAI";
import Marketplace from "./pages/Marketplace";
import MerchantProfile from "./pages/MerchantProfile";
import Wallet from "./pages/Wallet";
import RecipePlus from "./pages/RecipePlus";
import { GlobalRandomAd } from "./components/GlobalRandomAd";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos de cache
      retry: 1,
    },
  },
})

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Index />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/auth" element={<Auth />} />

            {/* Rutas protegidas — requieren sesión */}
            <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/app/map" element={<ProtectedRoute><MapView /></ProtectedRoute>} />
            <Route path="/app/center/:id" element={<ProtectedRoute><CenterDetail /></ProtectedRoute>} />
            <Route path="/app/qr" element={<ProtectedRoute><QrScreen /></ProtectedRoute>} />
            <Route path="/app/simulator" element={<ProtectedRoute><Simulator /></ProtectedRoute>} />
            <Route path="/app/impact" element={<ProtectedRoute><Impact /></ProtectedRoute>} />
            <Route path="/app/community" element={<Navigate to="/app" replace />} />
            <Route path="/app/marketplace/:id" element={<ProtectedRoute><MarketplaceDetail /></ProtectedRoute>} />
            <Route path="/app/merchant/:id" element={<ProtectedRoute><MerchantProfile /></ProtectedRoute>} />
            <Route path="/app/coupons" element={<ProtectedRoute><Coupons /></ProtectedRoute>} />
            <Route path="/app/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/app/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/app/scan" element={<ProtectedRoute><ScanAI /></ProtectedRoute>} />
            <Route path="/app/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
            <Route path="/app/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
            <Route path="/app/plus" element={<ProtectedRoute><RecipePlus /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          <GlobalRandomAd />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
)

export default App
