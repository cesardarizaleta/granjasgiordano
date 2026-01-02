import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePriceFormatter } from "@/hooks/usePriceFormatter";
import { useDolar } from "@/hooks/useDolar";
import { SimplePagination } from "@/components/SimplePagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Eye, ShoppingCart, Loader2, CheckCircle, Trash2 } from "lucide-react";
import { ventaService, clienteService, cobranzaService, inventarioService } from "@/services";
import type { Venta, Cliente, Producto, VentaItem } from "@/services";
import { supabase } from "@/integrations/supabase/client";
import { useConfirm } from "@/hooks/useConfirm";

import { BADGE_VARIANTS, MODULE_CONFIG } from "@/constants";
import { DetallesVentaModal } from "../components/DetallesVentaModal";

interface Sale extends Venta {
  cliente_nombre?: string;
}

const Ventas = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<string>("");
  const [isInDollars, setIsInDollars] = useState<boolean>(true);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ventaItems, setVentaItems] = useState<Omit<VentaItem, "id" | "venta_id">[]>([]);
  const [selectedProducto, setSelectedProducto] = useState<string>("");
  const [cantidad, setCantidad] = useState<string>("1");
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = MODULE_CONFIG.ventas.pageSize;

  const { formatPriceDual } = usePriceFormatter();
  const { oficialRate } = useDolar();
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    loadSales();
    loadClientes();
    loadProductos();
  }, [currentPage]);

  const loadProductos = async () => {
    try {
      const response = await inventarioService.getProductos(1, 100);
      if (response.error) {
        console.error("Error loading products:", response.error);
      } else {
        setProductos(response.data || []);
      }
    } catch {
      console.error("Error loading products");
    }
  };

  const loadClientes = async () => {
    try {
      const response = await clienteService.getClientes();
      if (response.error) {
        console.error("Error loading clients:", response.error);
      } else {
        setClientes(response.data || []);
      }
    } catch {
      console.error("Error loading clients");
    }
  };

  const loadSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ventaService.getVentas(currentPage, pageSize);
      if (response.error) {
        setError(response.error);
      } else {
        setSales(response.data || []);
        setTotalPages(Math.ceil(response.count / pageSize));
      }
    } catch {
      setError("Error al cargar ventas");
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale => {
    const matchesSearch =
      (sale.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      String(sale.id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterEstado === "todos" || sale.estado === filterEstado;
    return matchesSearch && matchesFilter;
  });

  const totalVentas = filteredSales.reduce((acc, sale) => acc + sale.total, 0);
  const totalVentasBS = filteredSales.reduce((acc, sale) => acc + (sale.total_bs || 0), 0);

  const resetForm = () => {
    setSelectedCliente("");
    setIsInDollars(true);
    setVentaItems([]);
    setSelectedProducto("");
    setCantidad("1");
  };

  const handleViewSaleDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailsModalOpen(true);
  };

  const handleAddItem = () => {
    if (!selectedProducto || !cantidad) return;

    const producto = productos.find(p => p.id === parseInt(selectedProducto));
    if (!producto) return;

    const qty = parseInt(cantidad);
    if (qty <= 0 || qty > producto.stock) return;

    const precioUnitario = isInDollars ? producto.precio : producto.precio_bs;
    const subtotal = precioUnitario * qty;
    const precioUnitarioBS = producto.precio_bs;
    const subtotalBS = precioUnitarioBS * qty;

    const newItem: Omit<VentaItem, "id" | "venta_id"> = {
      producto_id: producto.id,
      cantidad: qty,
      precio_unitario: precioUnitario,
      precio_unitario_bs: precioUnitarioBS,
      subtotal: subtotal,
      subtotal_bs: subtotalBS,
    };

    setVentaItems([...ventaItems, newItem]);
    setSelectedProducto("");
    setCantidad("1");
  };

  const handleRemoveItem = (index: number) => {
    setVentaItems(ventaItems.filter((_, i) => i !== index));
  };

  const handleAddSale = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (ventaItems.length === 0) {
      setError("Debes agregar al menos un producto a la venta");
      return;
    }

    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("No se pudo identificar al usuario actual");
        setLoading(false);
        return;
      }

      // Calcular totales
      const totalUSD = ventaItems.reduce((sum, item) => sum + item.subtotal, 0);
      const totalBS = ventaItems.reduce((sum, item) => sum + item.subtotal_bs, 0);

      const saleData = {
        cliente_id: selectedCliente ? parseInt(selectedCliente) : undefined,
        fecha_venta: new Date().toISOString(),
        total: totalUSD,
        total_bs: totalBS,
        tasa_cambio_aplicada: oficialRate,
        estado: "pendiente",
        user_id: user.id,
      };

      const response = await ventaService.createVenta(saleData, ventaItems);
      if (response.error) {
        setError(response.error);
      } else {
        setSales([response.data!, ...sales]);
        setIsDialogOpen(false);
        resetForm();
      }
    } catch {
      setError("Error al crear venta");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSale = async (sale: Sale) => {
    const confirmed = await confirm({
      title: "Confirmar Aprobación",
      description: "¿Estás seguro de aprobar esta venta? Se generará una cuenta por cobrar.",
    });
    if (!confirmed) return;

    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("No se pudo identificar al usuario actual");
        setLoading(false);
        return;
      }

      // 1. Actualizar estado de la venta
      const updateResponse = await ventaService.updateVenta(sale.id, { estado: "completado" });

      if (updateResponse.error) {
        setError("Error al actualizar la venta: " + updateResponse.error);
        setLoading(false);
        return;
      }

      // 2. Crear registro de cobranza
      const cobranzaData = {
        venta_id: sale.id,
        monto_pendiente: sale.total,
        monto_pendiente_bs: sale.total_bs,
        estado: "pendiente",
        user_id: user.id,
      };

      const cobranzaResponse = await cobranzaService.createCobranza(cobranzaData);

      if (cobranzaResponse.error) {
        setError("Venta actualizada pero error al crear cobranza: " + cobranzaResponse.error);
      } else {
        // Actualizar lista local
        setSales(sales.map(s => (s.id === sale.id ? { ...s, estado: "completado" } : s)));
      }
    } catch (err) {
      setError("Error inesperado al aprobar venta");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Ventas</h1>
            <p className="text-muted-foreground">Gestión de pedidos y transacciones</p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={open => {
              setIsDialogOpen(open);
              if (!open) {
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nueva Venta
              </Button>
            </DialogTrigger>
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

                <Button type="submit" className="w-full" disabled={ventaItems.length === 0}>
                  Registrar Venta
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters and Stats */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente o ID..."
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="procesando">Procesando</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="completado">Completado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="px-4 py-2 h-10 flex items-center">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Total: {formatPriceDual(totalVentas, totalVentasBS)}
          </Badge>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}

        {/* Loading or Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Cargando ventas...</span>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-sm animate-slide-up overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[80px]">ID</TableHead>
                  <TableHead className="min-w-[120px]">Fecha</TableHead>
                  <TableHead className="min-w-[150px]">Cliente</TableHead>
                  <TableHead className="min-w-[100px]">Total</TableHead>
                  <TableHead className="min-w-[100px]">Estado</TableHead>
                  <TableHead className="min-w-[120px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No se encontraron ventas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map(sale => (
                    <TableRow key={sale.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-mono text-sm">{sale.id}</TableCell>
                      <TableCell>{new Date(sale.fecha_venta).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{sale.cliente || "N/A"}</TableCell>
                      <TableCell className="font-semibold">
                        {formatPriceDual(sale.total, sale.total_bs)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            BADGE_VARIANTS.estadoBadgeVariant[
                              sale.estado as keyof typeof BADGE_VARIANTS.estadoBadgeVariant
                            ] || "secondary"
                          }
                        >
                          {sale.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {sale.estado === "pendiente" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleApproveSale(sale)}
                              title="Aprobar y generar cobranza"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewSaleDetails(sale)}
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <SimplePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          loading={loading}
        />
      </div>
      {ConfirmDialog}

      <DetallesVentaModal
        isOpen={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        selectedSale={selectedSale}
        productos={productos}
      />
    </MainLayout>
  );
};

export default Ventas;
