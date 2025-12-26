import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DashboardPortaria from "./pages/DashboardPortaria";
import Vehicles from "./pages/Vehicles";
import CottonPull from "./pages/CottonPull";
import CottonPullHistory from "./pages/CottonPullHistory";
import Loading from "./pages/Loading";
import LoadingHistory from "./pages/LoadingHistory";
import Rain from "./pages/Rain";
import Equipment from "./pages/Equipment";
import Reports from "./pages/Reports";
import RelatorioGestaoPuxe from "./pages/RelatorioGestaoPuxe";
import MaterialReceipts from "./pages/MaterialReceipts";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard-tv" element={<DashboardPortaria />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/cotton-pull" element={<CottonPull />} />
          <Route path="/cotton-pull/history" element={<CottonPullHistory />} />
          <Route path="/loading" element={<Loading />} />
          <Route path="/loading/history" element={<LoadingHistory />} />
          <Route path="/rain" element={<Rain />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/gestao-puxe" element={<RelatorioGestaoPuxe />} />
          <Route path="/materials" element={<MaterialReceipts />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
