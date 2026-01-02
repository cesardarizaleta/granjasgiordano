import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { usePriceFormatter } from "@/hooks/usePriceFormatter";
import { useDolar } from "@/hooks/useDolar";
import { useAuth } from "@/hooks/useAuth";
import { ventaService, clienteService, inventarioService } from "@/services";
import type { Cliente, Producto, VentaItem } from "@/services";
import { useToast } from "@/hooks/use-toast";

interface NuevaVentaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NuevaVentaModal({ open, onOpenChange }: NuevaVentaModalProps) {
  const { formatPriceDual } = usePriceFormatter();
  const { oficialRate: dolarValue } = useDolar();
  const { user } = useAuth();
  const { toast } = useToast();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [selectedCliente, setSelectedCliente] = useState("");
  const [selectedProducto, setSelectedProducto] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [ventaItems, setVentaItems] = useState<VentaItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      const [clientesData, productosData] = await Promise.all([
        clienteService.getClientes(1, 1000),
        inventarioService.getProductos(1, 1000),
      ]);
      setClientes(clientesData.data || []);
      setProductos(productosData.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const resetForm = () => {
    setSelectedCliente("");
    setSelectedProducto("");
    setCantidad("");
    setVentaItems([]);
  };

  const handleAddItem = () => {
    if (!selectedProducto || !cantidad) return;

    const producto = productos.find(p => p.id.toString() === selectedProducto);
    if (!producto) return;

    const qty = parseInt(cantidad);
    if (qty <= 0 || qty > producto.stock) return;

    const precioUnitario = producto.precio;
    const precioUnitarioBs = precioUnitario * dolarValue;
    const subtotal = precioUnitario * qty;
    const subtotalBs = precioUnitarioBs * qty;

    const newItem: VentaItem = {
      producto_id: producto.id,
      cantidad: qty,
      precio_unitario: precioUnitario,
      precio_unitario_bs: precioUnitarioBs,
      subtotal,
      subtotal_bs: subtotalBs,
    };

    setVentaItems([...ventaItems, newItem]);
    setSelectedProducto("");
    setCantidad("");
  };

  const handleRemoveItem = (index: number) => {
    setVentaItems(ventaItems.filter((_, i) => i !== index));
  };

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ventaItems.length === 0) return;

    setLoading(true);
    try {
      const totalUSD = ventaItems.reduce((sum, item) => sum + item.subtotal, 0);

      const ventaData = {
        cliente_id: selectedCliente ? parseInt(selectedCliente) : null,
        total: totalUSD,
        fecha_venta: new Date().toISOString(),
        estado: "completada",
        user_id: user?.id || "",
      };

      const items = ventaItems.map(item => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
      }));

      await ventaService.createVenta(ventaData, items);

      toast({
        title: "Venta registrada",
        description: "La venta ha sido registrada exitosamente.",
      });

      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error creating sale:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar la venta.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Registrar Nueva Venta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddSale} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente</Label>
            <Select value={selectedCliente} onValueChange={setSelectedCliente}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente (opcional)..." />
              </SelectTrigger>
              <SelectContent>
                {clientes.map(cliente => (
                  <SelectItem key={cliente.id} value={cliente.id.toString()}>
                    {cliente.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sección de productos */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Productos</Label>

            {/* Agregar producto */}
            <div className="flex gap-2">
              <Select value={selectedProducto} onValueChange={setSelectedProducto}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleccionar producto..." />
                </SelectTrigger>
                <SelectContent>
                  {productos
                    .filter(p => p.stock > 0)
                    .map(producto => (
                      <SelectItem key={producto.id} value={producto.id.toString()}>
                        {producto.nombre_producto} (Stock: {producto.stock})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Input
                value={cantidad}
                onChange={e => setCantidad(e.target.value)}
                type="number"
                min="1"
                placeholder="Cant."
                className="w-20"
              />
              <Button type="button" onClick={handleAddItem} variant="outline">
                Agregar
              </Button>
            </div>

            {/* Lista de productos agregados */}
            {ventaItems.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Productos en la venta:</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {ventaItems.map((item, index) => {
                    const producto = productos.find(p => p.id === item.producto_id);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{producto?.nombre_producto}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.cantidad} x{" "}
                            {formatPriceDual(item.precio_unitario, item.precio_unitario_bs)} ={" "}
                            {formatPriceDual(item.subtotal, item.subtotal_bs)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Total */}
            {ventaItems.length > 0 && (
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span>
                    {formatPriceDual(
                      ventaItems.reduce((sum, item) => sum + item.subtotal, 0),
                      ventaItems.reduce((sum, item) => sum + item.subtotal_bs, 0)
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={ventaItems.length === 0 || loading}>
            {loading ? "Registrando..." : "Registrar Venta"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
