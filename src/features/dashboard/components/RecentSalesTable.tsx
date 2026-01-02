import { useMemo, memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BADGE_VARIANTS, APP_CONFIG } from "@/constants";
import { useVentasRecent, useClientesMap } from "@/hooks/useQueries";
import type { RecentSale } from "@/services";

export const RecentSalesTable = memo(function RecentSalesTable() {
  const { data: ventasData, isLoading: ventasLoading } = useVentasRecent(
    APP_CONFIG.DASHBOARD.RECENT_SALES_LIMIT
  );
  const { data: clientesMap, isLoading: clientesLoading } = useClientesMap();

  const recentSales = useMemo((): RecentSale[] => {
    if (!ventasData?.data || !clientesMap) return [];

    return ventasData.data.map(venta => ({
      id: venta.id ? `VTA-${String(venta.id).slice(-3)}` : "VTA-???",
      cliente: venta.cliente_id
        ? clientesMap.get(venta.cliente_id) || "Cliente desconocido"
        : "Sin cliente",
      producto: "Múltiples productos", // We don't have product details in venta summary
      cantidad: "N/A", // We don't have quantity in venta summary
      total: `$${venta.total.toLocaleString()}`,
      estado: venta.estado,
    }));
  }, [ventasData?.data, clientesMap]);

  if (ventasLoading || clientesLoading) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 animate-slide-up">
        <div className="mb-6">
          <h3 className="text-lg font-display font-semibold text-foreground">Ventas Recientes</h3>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (ventasLoading || clientesLoading) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 animate-slide-up">
        <div className="mb-6">
          <h3 className="text-lg font-display font-semibold text-foreground">Ventas Recientes</h3>
          <p className="text-sm text-muted-foreground">Últimas transacciones realizadas</p>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="text-muted-foreground">Cargando ventas recientes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 animate-slide-up">
      <div className="mb-6">
        <h3 className="text-lg font-display font-semibold text-foreground">Ventas Recientes</h3>
        <p className="text-sm text-muted-foreground">Últimas transacciones realizadas</p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No hay ventas recientes
                </TableCell>
              </TableRow>
            ) : (
              recentSales.map(sale => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.id}</TableCell>
                  <TableCell>{sale.cliente}</TableCell>
                  <TableCell>{sale.producto}</TableCell>
                  <TableCell>{sale.cantidad}</TableCell>
                  <TableCell className="font-medium">{sale.total}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        BADGE_VARIANTS.estadoBadgeVariant[
                          sale.estado as keyof typeof BADGE_VARIANTS.estadoBadgeVariant
                        ] || "outline"
                      }
                    >
                      {sale.estado}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});
