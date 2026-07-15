import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
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
import Aeracao from "./pages/Aeracao";
import NotFound from "./pages/NotFound";
import { hasAuthenticatedSession } from "./hooks/use-auth";

const queryClient = new QueryClient();

const ProtectedRoute = () => {
  const location = useLocation();

  if (!hasAuthenticatedSession()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
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
            <Route path="/aeracao" element={<Aeracao />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
