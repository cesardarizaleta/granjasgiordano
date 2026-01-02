import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConfirm } from "@/hooks/useConfirm";
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
  Plus,
  Search,
  Loader2,
  DollarSign,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  FileText,
} from "lucide-react";
import { gastosService } from "../services/gastosService";
import type { GastosType, GastosStatsType, CategoriaGasto, EstadoGasto } from "../types/gastos";
import { usePriceFormatter } from "@/hooks/usePriceFormatter";
import { NuevoGastoModal } from "../components/NuevoGastoModal";
import { DetallesGastoModal } from "../components/DetallesGastoModal";
import { EditarGastoModal } from "../components/EditarGastoModal";
import { ComprobanteModal } from "../components/ComprobanteModal";

const Gastos = () => {
  const [items, setItems] = useState<GastosType[]>([]);
  const [stats, setStats] = useState<GastosStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoriaFilter, setCategoriaFilter] = useState<CategoriaGasto | "todos">("todos");
  const [estadoFilter, setEstadoFilter] = useState<EstadoGasto | "todos">("todos");
  const pageSize = 10;
  const { confirm, ConfirmDialog } = useConfirm();
  const { formatPrice } = usePriceFormatter();
  const [showNuevoGastoModal, setShowNuevoGastoModal] = useState(false);
  const [selectedGasto, setSelectedGasto] = useState<GastosType | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showComprobanteModal, setShowComprobanteModal] = useState(false);
  const [selectedComprobanteUrl, setSelectedComprobanteUrl] = useState<string | null>(null);

  useEffect(() => {
    loadItems();
    loadStats();
  }, [currentPage, categoriaFilter, estadoFilter]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const filters = {
        ...(categoriaFilter !== "todos" && { categoria: categoriaFilter }),
        ...(estadoFilter !== "todos" && { estado: estadoFilter }),
      };
      const response = await gastosService.getGastos(currentPage, pageSize, filters);
      if (response.error) {
        setError(response.error);
      } else {
        setItems(response.data || []);
        setTotalPages(Math.ceil(response.count / pageSize));
      }
    } catch {
      setError("Error al cargar gastos");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await gastosService.getEstadisticas();
      if (!response.error && response.data) {
        setStats(response.data);
      }
    } catch {
      console.error("Error loading stats:", err);
    }
  };

  const handleAprobar = async (gasto: GastosType) => {
    const confirmed = await confirm({
      title: "Aprobar Gasto",
      description: `¿Estás seguro de que quieres aprobar el gasto "${gasto.descripcion}" por ${formatPrice(gasto.monto)}? El gasto pasará al estado "Aprobado" y podrá ser marcado como pagado.`,
      confirmText: "Aprobar Gasto",
      cancelText: "Cancelar",
    });

    if (!confirmed) return;

    const response = await gastosService.aprobarGasto(gasto.id);
    if (!response.error) {
      loadItems();
      loadStats();
    }
  };

  const handleRechazar = async (gasto: GastosType) => {
    const confirmed = await confirm({
      title: "Rechazar Gasto",
      description: `¿Estás seguro de que quieres rechazar el gasto "${gasto.descripcion}" por ${formatPrice(gasto.monto)}? El gasto pasará al estado "Rechazado" y no podrá ser procesado.`,
      confirmText: "Rechazar Gasto",
      cancelText: "Cancelar",
    });

    if (!confirmed) return;

    const response = await gastosService.rechazarGasto(gasto.id);
    if (!response.error) {
      loadItems();
      loadStats();
    }
  };

  const handleMarcarPagado = async (gasto: GastosType) => {
    const confirmed = await confirm({
      title: "Marcar Gasto como Pagado",
      description: `¿Estás seguro de que quieres marcar como pagado el gasto "${gasto.descripcion}" por ${formatPrice(gasto.monto)}? El gasto pasará al estado "Pagado" y se considerará completado.`,
      confirmText: "Marcar como Pagado",
      cancelText: "Cancelar",
    });

    if (!confirmed) return;

    const response = await gastosService.marcarPagado(gasto.id);
    if (!response.error) {
      loadItems();
      loadStats();
    }
  };

  const handleDelete = async (gasto: GastosType) => {
    const confirmed = await confirm({
      title: "Eliminar Gasto",
      description: `¿Estás seguro de que quieres eliminar el gasto "${gasto.descripcion}" por ${formatPrice(gasto.monto)}? Esta acción no se puede deshacer y eliminará permanentemente toda la información del gasto.`,
      confirmText: "Eliminar Gasto",
      cancelText: "Cancelar",
    });

    if (!confirmed) return;

    const response = await gastosService.deleteGasto(gasto.id);
    if (!response.error) {
      loadItems();
      loadStats();
    }
  };

  const handleViewDetails = (gasto: GastosType) => {
    setSelectedGasto(gasto);
    setShowDetailsModal(true);
  };

  const handleEdit = (gasto: GastosType) => {
    setSelectedGasto(gasto);
    setShowEditModal(true);
  };

  const handleViewComprobante = (comprobanteUrl: string) => {
    setSelectedComprobanteUrl(comprobanteUrl);
    setShowComprobanteModal(true);
  };

  const filteredItems = items.filter(
    item =>
      item.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.referencia?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoriaLabel = (categoria: CategoriaGasto) => {
    const labels = {
      operativos: "Operativos",
      administrativos: "Administrativos",
      mantenimiento: "Mantenimiento",
      transporte: "Transporte",
      suministros: "Suministros",
      servicios_publicos: "Servicios Públicos",
      marketing: "Marketing",
      salarios: "Salarios",
      impuestos: "Impuestos",
      otros: "Otros",
    };
    return labels[categoria];
  };

  const getEstadoBadge = (estado: EstadoGasto) => {
    const variants = {
      pendiente: { variant: "secondary" as const, icon: Clock, label: "Pendiente" },
      aprobado: { variant: "default" as const, icon: CheckCircle, label: "Aprobado" },
      rechazado: { variant: "destructive" as const, icon: XCircle, label: "Rechazado" },
      pagado: { variant: "outline" as const, icon: DollarSign, label: "Pagado" },
      cancelado: { variant: "destructive" as const, icon: XCircle, label: "Cancelado" },
    };
    const config = variants[estado];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Gastos</h1>
            <p className="text-muted-foreground">Control de gastos y tesorería</p>
          </div>
          <Button className="gap-2" onClick={() => setShowNuevoGastoModal(true)}>
            <Plus className="w-4 h-4" />
            Nuevo Gasto
          </Button>
        </div>

        {/* Estadísticas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total del Mes</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPrice(stats.total_mes)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gastos Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.gastos_pendientes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gastos Aprobados</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.gastos_aprobados}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gastos Operativos</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPrice(stats.total_categoria.operativos)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar gastos..."
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={categoriaFilter}
            onValueChange={(value: CategoriaGasto | "todos") => setCategoriaFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas las categorías</SelectItem>
              <SelectItem value="operativos">Operativos</SelectItem>
              <SelectItem value="administrativos">Administrativos</SelectItem>
              <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
              <SelectItem value="transporte">Transporte</SelectItem>
              <SelectItem value="suministros">Suministros</SelectItem>
              <SelectItem value="servicios_publicos">Servicios Públicos</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="salarios">Salarios</SelectItem>
              <SelectItem value="impuestos">Impuestos</SelectItem>
              <SelectItem value="otros">Otros</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={estadoFilter}
            onValueChange={(value: EstadoGasto | "todos") => setEstadoFilter(value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="aprobado">Aprobado</SelectItem>
              <SelectItem value="pagado">Pagado</SelectItem>
              <SelectItem value="rechazado">Rechazado</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="px-4 py-2 h-10 flex items-center">
            {items.length} gastos
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
            <span className="ml-2 text-muted-foreground">Cargando gastos...</span>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-sm animate-slide-up overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>{new Date(item.fecha_gasto).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{item.descripcion}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoriaLabel(item.categoria)}</Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatPrice(item.monto)} {item.moneda}
                    </TableCell>
                    <TableCell>{getEstadoBadge(item.estado)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Ver detalle"
                          onClick={() => handleViewDetails(item)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Editar"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {item.estado === "pendiente" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Aprobar"
                              onClick={() => handleAprobar(item)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Rechazar"
                              onClick={() => handleRechazar(item)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {item.estado === "aprobado" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Marcar como pagado"
                            onClick={() => handleMarcarPagado(item)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <DollarSign className="w-4 h-4" />
                          </Button>
                        )}
                        {item.comprobante_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Ver comprobante"
                            onClick={() => handleViewComprobante(item.comprobante_url!)}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Eliminar"
                          onClick={() => handleDelete(item)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
      <NuevoGastoModal
        open={showNuevoGastoModal}
        onOpenChange={setShowNuevoGastoModal}
        onSuccess={() => {
          loadItems();
          loadStats();
        }}
      />
      <DetallesGastoModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        gasto={selectedGasto}
      />
      <EditarGastoModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        gasto={selectedGasto}
        onSuccess={() => {
          loadItems();
          loadStats();
        }}
      />
      <ComprobanteModal
        open={showComprobanteModal}
        onOpenChange={setShowComprobanteModal}
        comprobanteUrl={selectedComprobanteUrl}
      />
      {ConfirmDialog}
    </MainLayout>
  );
};

export default Gastos;
