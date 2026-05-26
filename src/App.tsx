import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Welcome from "./pages/Welcome.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import MapView from "./pages/MapView.tsx";
import CenterDetail from "./pages/CenterDetail.tsx";
import QrScreen from "./pages/QrScreen.tsx";
import Simulator from "./pages/Simulator.tsx";
import Impact from "./pages/Impact.tsx";
import Community from "./pages/Community.tsx";
import MarketplaceDetail from "./pages/MarketplaceDetail.tsx";
import Coupons from "./pages/Coupons.tsx";
import Profile from "./pages/Profile.tsx";
import Notifications from "./pages/Notifications.tsx";
import ScanAI from "./pages/ScanAI.tsx";
import Marketplace from "./pages/Marketplace.tsx";
import Wallet from "./pages/Wallet.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/map" element={<MapView />} />
          <Route path="/app/center/:id" element={<CenterDetail />} />
          <Route path="/app/qr" element={<QrScreen />} />
          <Route path="/app/simulator" element={<Simulator />} />
          <Route path="/app/impact" element={<Impact />} />
          <Route path="/app/community" element={<Community />} />
          <Route path="/app/marketplace/:id" element={<MarketplaceDetail />} />
          <Route path="/app/coupons" element={<Coupons />} />
          <Route path="/app/profile" element={<Profile />} />
          <Route path="/app/notifications" element={<Notifications />} />
          <Route path="/app/scan" element={<ScanAI />} />
          <Route path="/app/marketplace" element={<Marketplace />} />
          <Route path="/app/wallet" element={<Wallet />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
