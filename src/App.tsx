import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StoreInitializer } from "@/components/StoreInitializer";
import Dashboard from "./features/dashboard/pages/Dashboard";
import Inventario from "./features/inventario/pages/Inventario";
import Ventas from "./features/ventas/pages/Ventas";
import Cobranza from "./features/cobranza/pages/Cobranza";
import Clientes from "./features/clientes/pages/Clientes";
import Configuracion from "./features/configuracion/pages/Configuracion";
import Logs from "./features/logs/pages/Logs";
import Gastos from "./features/gastos/pages/Gastos";
import Login from "./features/auth/pages/Login";
import NotFound from "./features/error/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Configuración simplificada
      staleTime: 5 * 60 * 1000, // 5 minutos por defecto
      gcTime: 30 * 60 * 1000, // 30 minutos en cache
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Deshabilitado por defecto para mejor rendimiento
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <StoreInitializer />
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            {/* Rutas públicas */}
            <Route
              path="/login"
              element={
                <AuthGuard requireAuth={false}>
                  <Login />
                </AuthGuard>
              }
            />

            {/* Rutas protegidas */}
            <Route
              path="/"
              element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              }
            />
            <Route
              path="/inventario"
              element={
                <AuthGuard>
                  <Inventario />
                </AuthGuard>
              }
            />
            <Route
              path="/ventas"
              element={
                <AuthGuard>
                  <Ventas />
                </AuthGuard>
              }
            />
            <Route
              path="/cobranza"
              element={
                <AuthGuard>
                  <Cobranza />
                </AuthGuard>
              }
            />
            <Route
              path="/clientes"
              element={
                <AuthGuard>
                  <Clientes />
                </AuthGuard>
              }
            />
            <Route
              path="/configuracion"
              element={
                <AuthGuard>
                  <Configuracion />
                </AuthGuard>
              }
            />
            <Route
              path="/logs"
              element={
                <AuthGuard>
                  <Logs />
                </AuthGuard>
              }
            />
            <Route
              path="/gastos"
              element={
                <AuthGuard>
                  <Gastos />
                </AuthGuard>
              }
            />

            {/* Ruta 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
