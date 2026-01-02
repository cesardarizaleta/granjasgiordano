import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { usePriceFormatter } from "@/hooks/usePriceFormatter";
import { ventaService } from "../services/ventaService";
import type { VentaItem, Producto } from "@/services";

interface Sale extends Venta {
  cliente?: string;
}

interface DetallesVentaModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSale: Sale | null;
  productos: Producto[];
}

export const DetallesVentaModal = ({
  isOpen,
  onOpenChange,
  selectedSale,
  productos,
}: DetallesVentaModalProps) => {
  const [saleItems, setSaleItems] = useState<VentaItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { formatPriceDual } = usePriceFormatter();

  useEffect(() => {
    if (isOpen && selectedSale) {
      loadSaleDetails();
    }
  }, [isOpen, selectedSale]);

  const loadSaleDetails = async () => {
    if (!selectedSale) return;

    setLoadingDetails(true);
    try {
      const response = await ventaService.getVentaById(selectedSale.id);
      if (response.data && response.data.items) {
        setSaleItems(response.data.items);
      } else {
        setSaleItems([]);
      }
    } catch (err) {
      console.error("Error loading sale details:", err);
      setSaleItems([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles de Venta #{selectedSale?.id}</DialogTitle>
          <DialogDescription>Información completa de la venta realizada</DialogDescription>
        </DialogHeader>

        {loadingDetails ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Cargando detalles...</span>
          </div>
        ) : selectedSale ? (
          <div className="space-y-6">
            {/* Información general de la venta */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Fecha</Label>
                <p className="text-sm">{new Date(selectedSale.fecha_venta).toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Cliente</Label>
                <p className="text-sm">{selectedSale.cliente || "N/A"}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                <p className="text-sm capitalize">{selectedSale.estado}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Tasa de Cambio</Label>
                <p className="text-sm">{selectedSale.tasa_cambio_aplicada?.toFixed(2) || "N/A"}</p>
              </div>
            </div>

            {/* Productos vendidos */}
            <div>
              <Label className="text-base font-medium mb-3 block">Productos Vendidos</Label>
              {saleItems.length > 0 ? (
                <div className="space-y-3">
                  {saleItems.map((item, index) => {
                    const producto = productos.find(p => p.id === item.producto_id);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {producto?.nombre_producto || `Producto ${item.producto_id}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Cantidad: {item.cantidad} ×{" "}
                            {formatPriceDual(item.precio_unitario, item.precio_unitario_bs)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatPriceDual(item.subtotal, item.subtotal_bs)}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Total */}
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total de la venta:</span>
                      <span>{formatPriceDual(selectedSale.total, selectedSale.total_bs)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No se encontraron productos para esta venta
                </p>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
