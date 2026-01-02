import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "../components/StatCard";
import { RecentSalesTable } from "../components/RecentSalesTable";
import { SalesChart } from "../components/SalesChart";
import { InventoryStatus } from "../components/InventoryStatus";
import { DollarSign, Package, ShoppingCart, AlertCircle, RefreshCw } from "lucide-react";
import { useDashboardData } from "@/hooks/useQueries";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/constants";

const Dashboard = () => {
  const { isLoading, isError, stats, refetchAll } = useDashboardData();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Cargando datos del dashboard...</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-xl border border-border shadow-sm p-6 animate-pulse"
              >
                <div className="h-20" />
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-xl border border-border shadow-sm p-6 animate-pulse"
              >
                <div className="h-80" />
              </div>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isError) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error al cargar datos</h2>
            <p className="text-muted-foreground mb-4">
              No se pudieron cargar los datos del dashboard.
            </p>
            <Button onClick={refetchAll} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Bienvenido a <span className="text-primary">{APP_CONFIG.BRAND.NAME}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Resumen general del negocio •{" "}
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Ventas del Mes"
            value={`$${stats.ventasMes.toLocaleString()}`}
            change="+12.5% vs mes anterior"
            changeType="positive"
            icon={DollarSign}
            iconColor="primary"
          />
          <StatCard
            title="Inventario Total"
            value={`${stats.inventarioTotal.toLocaleString()} kg`}
            change={`${Math.round((stats.inventarioTotal / Math.max(stats.inventarioTotal * 1.5, 50000)) * 100)}% capacidad`}
            changeType="neutral"
            icon={Package}
            iconColor="success"
          />
          <StatCard
            title="Pedidos Pendientes"
            value={stats.pedidosPendientes.toString()}
            change="5 urgentes"
            changeType="negative"
            icon={ShoppingCart}
            iconColor="warning"
          />
          <StatCard
            title="Cuentas por Cobrar"
            value={`$0`} // Placeholder - implementar lógica después
            change="8 facturas vencidas"
            changeType="negative"
            icon={AlertCircle}
            iconColor="accent"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SalesChart />
          </div>
          <div>
            <InventoryStatus />
          </div>
        </div>

        {/* Recent Sales Table */}
        <RecentSalesTable />
      </div>
    </MainLayout>
  );
};

export default Dashboard;
