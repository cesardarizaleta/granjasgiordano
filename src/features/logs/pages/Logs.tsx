import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Search,
  RefreshCw,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Database,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { MODULE_CONFIG } from "@/constants";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { loggingService } from "@/services";
import ExcelJS from "exceljs";

interface LogEntry {
  id: string;
  timestamp: string;
  user_email: string;
  table_name: string;
  operation: string;
  record_id: string | null;
  error_message: string | null;
  execution_time_ms: number | null;
}

interface LogStats {
  table_name: string;
  operation: string;
  count: number;
  last_operation: string;
}

const operationIcons = {
  INSERT: <CheckCircle className="w-4 h-4 text-green-500" />,
  UPDATE: <RefreshCw className="w-4 h-4 text-blue-500" />,
  DELETE: <XCircle className="w-4 h-4 text-red-500" />,
  SELECT: <Eye className="w-4 h-4 text-gray-500" />,
  ERROR: <AlertTriangle className="w-4 h-4 text-orange-500" />,
};

const operationColors = {
  INSERT: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
  SELECT: "outline",
  ERROR: "destructive",
} as const;

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats[]>([]);
  const [totalOperationsCount, setTotalOperationsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [operationFilter, setOperationFilter] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<number>(7); // días
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = MODULE_CONFIG.logs.pageSize;
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportLimit, setExportLimit] = useState(1000);
  const [exportTableFilter, setExportTableFilter] = useState<string>("all");
  const [exportOperationFilter, setExportOperationFilter] = useState<string>("all");
  const [exportTimeRange, setExportTimeRange] = useState<number>(30);
  const [exporting, setExporting] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    try {
      // Cargar logs (prioridad)
      const { data: logsData, count } = await loggingService.getLogs(currentPage, pageSize);
      setLogs(logsData);
      setTotalPages(Math.ceil(count / pageSize));

      // Cargar estadísticas y total (secundario, no bloqueante)
      try {
        const [statsData, totalOps] = await Promise.all([
          loggingService.getLogStatistics(timeRange),
          loggingService.getTotalOperations(),
        ]);
        setStats(statsData);
        setTotalOperationsCount(totalOps);
      } catch (statsError) {
        console.warn("Error loading stats:", statsError);
      }
    } catch (error) {
      console.error("Error loading logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [timeRange, currentPage]);

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.operation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.error_message && log.error_message.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTable = tableFilter === "all" || log.table_name === tableFilter;
    const matchesOperation = operationFilter === "all" || log.operation === operationFilter;

    return matchesSearch && matchesTable && matchesOperation;
  });

  const uniqueTables = [...new Set(logs.map(log => log.table_name))];
  const uniqueOperations = [...new Set(logs.map(log => log.operation))];

  const totalOperations = totalOperationsCount;
  const errorCount = logs.filter(log => log.error_message).length;
  const avgExecutionTime = logs
    .filter(log => log.execution_time_ms)
    .reduce((acc, log, _, arr) => acc + (log.execution_time_ms || 0) / arr.length, 0);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const exportData = await loggingService.getLogsForExport({
        limit: exportLimit,
        tableFilter: exportTableFilter,
        operationFilter: exportOperationFilter,
        searchTerm,
        timeRangeDays: exportTimeRange,
      });

      if (!exportData.length) {
        setExporting(false);
        setExportModalOpen(false);
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Logs");

      worksheet.properties.defaultRowHeight = 20;

      worksheet.mergeCells("A1:H1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = `Logs del sistema (${exportData.length} registros)`;
      titleCell.font = { size: 14, bold: true, color: { argb: "FF1F2937" } };
      titleCell.alignment = { horizontal: "center" };

      worksheet.getRow(2).values = [
        "Fecha",
        "Usuario",
        "Tabla",
        "Operación",
        "ID Registro",
        "Tiempo (ms)",
        "Estado",
        "Detalle",
      ];

      worksheet.columns = [
        { key: "fecha", width: 22 },
        { key: "usuario", width: 28 },
        { key: "tabla", width: 18 },
        { key: "operacion", width: 14 },
        { key: "registro", width: 18 },
        { key: "tiempo", width: 12 },
        { key: "estado", width: 14 },
        { key: "detalle", width: 40 },
      ];

      worksheet.getRow(2).eachCell(cell => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE5E7EB" },
        };
        cell.font = { bold: true, color: { argb: "FF111827" } };
        cell.border = {
          bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
        };
      });

      exportData.forEach((log, index) => {
        const row = worksheet.addRow({
          fecha: new Date(log.timestamp || "").toLocaleString(),
          usuario: log.user_email || "Sistema",
          tabla: log.table_name,
          operacion: log.operation,
          registro: log.record_id || "-",
          tiempo: log.execution_time_ms || "-",
          estado: log.error_message ? "Error" : "OK",
          detalle: log.error_message || "",
        });

        row.eachCell(cell => {
          cell.border = { bottom: { style: "hair", color: { argb: "FFE5E7EB" } } };
          cell.alignment = { vertical: "middle", wrapText: true };
        });

        if (index % 2 === 0) {
          row.eachCell(cell => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF9FAFB" },
            };
          });
        }
      });

      worksheet.autoFilter = {
        from: { row: 2, column: 1 },
        to: { row: 2, column: 8 },
      };
      worksheet.views = [{ state: "frozen", ySplit: 2 }];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logs_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      setExportModalOpen(false);
    } catch (error) {
      console.error("Error exporting logs:", error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Logs del Sistema</h1>
            <p className="text-muted-foreground">Monitoreo completo de todas las operaciones</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setExportTableFilter(tableFilter);
                setExportOperationFilter(operationFilter);
                setExportTimeRange(timeRange);
                setExportLimit(1000);
                setExportModalOpen(true);
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
            <Button onClick={loadLogs} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Operaciones</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOperations.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Últimos {timeRange} días</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Errores</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <p className="text-xs text-muted-foreground">
                {((errorCount / totalOperations) * 100).toFixed(1)}% del total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgExecutionTime.toFixed(0)}ms</div>
              <p className="text-xs text-muted-foreground">Por operación</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tablas Monitoreadas</CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueTables.length}</div>
              <p className="text-xs text-muted-foreground">Con logging activo</p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Table */}
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas por Tabla</CardTitle>
            <CardDescription>Resumen de operaciones por tabla y tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tabla</TableHead>
                  <TableHead>Operación</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Última Operación</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.map((stat, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{stat.table_name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          operationColors[stat.operation as keyof typeof operationColors] ||
                          "outline"
                        }
                      >
                        {stat.operation}
                      </Badge>
                    </TableCell>
                    <TableCell>{stat.count.toLocaleString()}</TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(stat.last_operation), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Logs Recientes</CardTitle>
            <CardDescription>Historial detallado de operaciones del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuario, tabla, operación o error..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={tableFilter} onValueChange={setTableFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar tabla" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las tablas</SelectItem>
                  {uniqueTables.map(table => (
                    <SelectItem key={table} value={table}>
                      {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={operationFilter} onValueChange={setOperationFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar operación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las operaciones</SelectItem>
                  {uniqueOperations.map(operation => (
                    <SelectItem key={operation} value={operation}>
                      {operation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={timeRange.toString()}
                onValueChange={value => setTimeRange(Number(value))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Rango de tiempo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Último día</SelectItem>
                  <SelectItem value="7">Última semana</SelectItem>
                  <SelectItem value="30">Último mes</SelectItem>
                  <SelectItem value="90">Últimos 3 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Logs Table */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Cargando logs...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Tabla</TableHead>
                    <TableHead>Operación</TableHead>
                    <TableHead>ID Registro</TableHead>
                    <TableHead>Tiempo</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        No se encontraron logs
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map(log => (
                      <TableRow key={log.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">
                          {formatDistanceToNow(new Date(log.timestamp), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </TableCell>
                        <TableCell className="font-medium">{log.user_email || "Sistema"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.table_name}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {operationIcons[log.operation as keyof typeof operationIcons]}
                            <Badge
                              variant={
                                operationColors[log.operation as keyof typeof operationColors] ||
                                "outline"
                              }
                            >
                              {log.operation}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.record_id ? `${log.record_id.slice(0, 8)}...` : "-"}
                        </TableCell>
                        <TableCell>
                          {log.execution_time_ms ? `${log.execution_time_ms}ms` : "-"}
                        </TableCell>
                        <TableCell>
                          {log.error_message ? (
                            <Badge variant="destructive" className="text-xs">
                              Error
                            </Badge>
                          ) : (
                            <Badge variant="default" className="text-xs">
                              OK
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            {/* Pagination */}
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || loading}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar logs a Excel</DialogTitle>
            <DialogDescription>
              Define el número de registros (máx. 1000) y filtros para la exportación.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="export-limit">Cantidad de registros (hasta 10,000)</Label>
              <Input
                id="export-limit"
                type="number"
                min={10}
                max={10000}
                value={exportLimit}
                onChange={e =>
                  setExportLimit(Math.min(10000, Math.max(0, Number(e.target.value) || 0)))
                }
              />
              <p className="text-xs text-muted-foreground">
                Recomendado: hasta 1000 registros. Puedes exportar hasta 10,000 bajo tu propio
                riesgo. Puede tardar más y ser pesado para el navegador.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tabla</Label>
                <Select value={exportTableFilter} onValueChange={setExportTableFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tabla" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {uniqueTables.map(table => (
                      <SelectItem key={table} value={table}>
                        {table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Operación</Label>
                <Select value={exportOperationFilter} onValueChange={setExportOperationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona operación" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {uniqueOperations.map(operation => (
                      <SelectItem key={operation} value={operation}>
                        {operation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rango de tiempo</Label>
                <Select
                  value={exportTimeRange.toString()}
                  onValueChange={value => setExportTimeRange(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona rango" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Último día</SelectItem>
                    <SelectItem value="7">Última semana</SelectItem>
                    <SelectItem value="30">Último mes</SelectItem>
                    <SelectItem value="90">Últimos 3 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setExportModalOpen(false)}
              disabled={exporting}
            >
              Cancelar
            </Button>
            <Button onClick={handleExportExcel} disabled={exporting}>
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exportando...
                </>
              ) : (
                "Exportar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
