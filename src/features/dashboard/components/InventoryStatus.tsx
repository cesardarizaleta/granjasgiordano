import { useMemo, memo } from "react";
import { Progress } from "@/components/ui/progress";
import { APP_CONFIG } from "@/constants";
import { useInventarioStatus } from "@/hooks/useQueries";
import type { Producto } from "@/services";

interface InventoryItem {
  nombre: string;
  stock: number;
  capacidad: number;
  unidad: string;
}

export const InventoryStatus = memo(function InventoryStatus() {
  const { data: productosData, isLoading } = useInventarioStatus();

  const inventoryItems = useMemo((): InventoryItem[] => {
    if (!productosData?.data) return [];

    // Group products by category and calculate totals
    const categoryTotals = new Map<string, { stock: number; productos: Producto[] }>();

    productosData.data.forEach(producto => {
      const category = producto.categoria || "Sin categoría";
      if (!categoryTotals.has(category)) {
        categoryTotals.set(category, { stock: 0, productos: [] });
      }
      const categoryData = categoryTotals.get(category)!;
      categoryData.stock += producto.stock * (producto.peso || 0);
      categoryData.productos.push(producto);
    });

    // Convert to inventory items with estimated capacity
    const sortedItems = Array.from(categoryTotals.entries())
      .map(([category, data]) => {
        const capacidad = Math.max(data.stock * 2, APP_CONFIG.INVENTORY.MIN_CAPACITY_KG / 10);
        return {
          nombre: category,
          stock: data.stock,
          capacidad,
          unidad: "kg",
        };
      })
      .sort((a, b) => a.stock / a.capacidad - b.stock / b.capacidad);

    return sortedItems.slice(0, APP_CONFIG.DASHBOARD.INVENTORY_CATEGORIES_LIMIT);
  }, [productosData?.data]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 animate-slide-up">
        <div className="mb-6">
          <h3 className="text-lg font-display font-semibold text-foreground">
            Estado del Inventario
          </h3>
          <p className="text-sm text-muted-foreground">Cargando datos...</p>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="text-muted-foreground">Cargando inventario...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 animate-slide-up">
      <div className="mb-6">
        <h3 className="text-lg font-display font-semibold text-foreground">
          Estado del Inventario
        </h3>
        <p className="text-sm text-muted-foreground">Niveles de stock actuales</p>
      </div>
      <div className="space-y-5">
        {inventoryItems.map(item => {
          const percentage = (item.stock / item.capacidad) * 100;
          const isLow = percentage < 30;
          const isMedium = percentage >= 30 && percentage < 60;

          return (
            <div key={item.nombre} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">{item.nombre}</span>
                <span className="text-sm text-muted-foreground">
                  {item.stock.toLocaleString()} / {item.capacidad.toLocaleString()} {item.unidad}
                </span>
              </div>
              <Progress
                value={percentage}
                className={`h-2 ${isLow ? "[&>div]:bg-destructive" : isMedium ? "[&>div]:bg-warning" : "[&>div]:bg-success"}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});
