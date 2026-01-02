import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SimplePagination } from "@/components/SimplePagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, CheckCircle, AlertCircle, Clock, DollarSign, Loader2 } from "lucide-react";
import { BADGE_VARIANTS, MODULE_CONFIG } from "@/constants";
import { cobranzaService } from "@/services";
import type { Cobranza } from "@/services";

interface Invoice extends Cobranza {
  cliente: string; // Nombre del cliente
  venta_id: string;
  monto_pendiente: number;
  fecha_vencimiento?: string;
  estado: string;
  notas?: string;
  user_id: string;
}

const estadoIcon = {
  pagado: CheckCircle,
  pendiente: Clock,
  parcial: DollarSign,
  vencido: AlertCircle,
};

const Cobranza = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = MODULE_CONFIG.cobranza.pageSize;

  useEffect(() => {
    loadInvoices();
  }, [currentPage]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await cobranzaService.getCobranzas(currentPage, pageSize);
      if (response.error) {
        setError(response.error);
      } else {
        // Agregar nombre del cliente a cada factura (mock)
        const invoicesWithClient = (response.data || []).map(cobranza => ({
          ...cobranza,
          cliente: `Cliente ${cobranza.venta_id}`, // Mock client name
          venta_id: cobranza.venta_id,
          monto_pendiente: cobranza.monto_pendiente,
          fecha_vencimiento: cobranza.fecha_vencimiento,
          estado: cobranza.estado,
          notas: cobranza.notas,
          user_id: cobranza.user_id,
        }));
        setInvoices(invoicesWithClient);
        setTotalPages(Math.ceil(response.count / pageSize));
      }
    } catch {
      setError("Error al cargar cobranzas");
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      invoice.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(invoice.id).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterEstado === "todos" || invoice.estado === filterEstado;
    return matchesSearch && matchesFilter;
  });

  const totalPendiente = invoices
    .filter(inv => inv.estado !== "pagado")
    .reduce((acc, inv) => acc + inv.monto_pendiente, 0);

  const totalVencido = invoices
    .filter(inv => inv.estado === "vencido")
    .reduce((acc, inv) => acc + inv.monto_pendiente, 0);

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const formData = new FormData(e.currentTarget);
    const montoPago = Number(formData.get("monto"));

    try {
      // For now, just update the local state. In a real app, you'd call an update service
      setInvoices(
        invoices.map(inv => {
          if (inv.id === selectedInvoice.id) {
            const nuevoMontoPendiente = Math.max(0, inv.monto_pendiente - montoPago);
            const nuevoEstado =
              nuevoMontoPendiente === 0
                ? "pagado"
                : nuevoMontoPendiente < inv.monto_pendiente
                  ? "parcial"
                  : inv.estado;
            return { ...inv, monto_pendiente: nuevoMontoPendiente, estado: nuevoEstado };
          }
          return inv;
        })
      );
      setIsPaymentDialogOpen(false);
      setSelectedInvoice(null);
    } catch {
      setError("Error al procesar pago");
    }
  };

  const openPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentDialogOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-display font-bold text-foreground">Cobranza</h1>
          <p className="text-muted-foreground">Gestión de cuentas por cobrar</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pendiente</p>
                <p className="text-2xl font-display font-bold">
                  ${totalPendiente.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Vencido</p>
                <p className="text-2xl font-display font-bold text-destructive">
                  ${totalVencido.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Facturas Pagadas</p>
                <p className="text-2xl font-display font-bold">
                  {invoices.filter(i => i.estado === "pagado").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente o factura..."
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
              <SelectItem value="parcial">Parcial</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
              <SelectItem value="pagado">Pagado</SelectItem>
            </SelectContent>
          </Select>
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
            <span className="ml-2 text-muted-foreground">Cargando cobranzas...</span>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-sm animate-slide-up overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Factura</TableHead>
                  <TableHead className="min-w-[100px]">Venta ID</TableHead>
                  <TableHead className="min-w-[120px]">Vencimiento</TableHead>
                  <TableHead className="min-w-[130px]">Monto Pendiente</TableHead>
                  <TableHead className="min-w-[100px]">Estado</TableHead>
                  <TableHead className="min-w-[120px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No se encontraron cobranzas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map(invoice => {
                    const Icon = estadoIcon[invoice.estado] || Clock;
                    return (
                      <TableRow key={invoice.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono text-sm">{invoice.id}</TableCell>
                        <TableCell className="font-mono text-sm">{invoice.venta_id}</TableCell>
                        <TableCell>
                          {invoice.fecha_vencimiento
                            ? new Date(invoice.fecha_vencimiento).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell className="font-semibold">
                          ${invoice.monto_pendiente.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              BADGE_VARIANTS.estadoBadgeVariant[
                                invoice.estado as keyof typeof BADGE_VARIANTS.estadoBadgeVariant
                              ] || "secondary"
                            }
                            className="gap-1"
                          >
                            <Icon className="w-3 h-3" />
                            {invoice.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {invoice.estado !== "pagado" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPaymentDialog(invoice)}
                            >
                              Registrar Pago
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
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

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display">Registrar Pago</DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <form onSubmit={handlePayment} className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Factura:</span> {selectedInvoice.id}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Cliente:</span>{" "}
                    {selectedInvoice.cliente}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Saldo pendiente:</span>{" "}
                    <span className="font-semibold">
                      ${selectedInvoice.monto_pendiente.toFixed(2)}
                    </span>
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monto">Monto a Pagar ($)</Label>
                  <Input
                    id="monto"
                    name="monto"
                    type="number"
                    step="0.01"
                    max={selectedInvoice.monto_pendiente}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Confirmar Pago
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Cobranza;
