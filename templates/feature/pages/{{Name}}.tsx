import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Search, Loader2 } from "lucide-react";
import { {{name}}Service } from "../services/{{name}}Service";
import type { {{Name}} } from "@/services";

const {{Name}} = () => {
  const [items, setItems] = useState<{{Name}}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    loadItems();
  }, [currentPage]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await {{name}}Service.get{{Name}}s(currentPage, pageSize);
      if (response.error) {
        setError(response.error);
      } else {
        setItems(response.data || []);
        setTotalPages(Math.ceil(response.count / pageSize));
      }
    } catch (err) {
      setError("Error al cargar {{name}}s");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(
    item =>
      item.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">{{Name}}</h1>
            <p className="text-muted-foreground">Gestión de {{name}}s</p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo {{Name}}
          </Button>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar {{name}}s..."
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Badge variant="outline" className="px-4 py-2 h-10 flex items-center">
            {items.length} {{name}}s
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
            <span className="ml-2 text-muted-foreground">Cargando {{name}}s...</span>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-sm animate-slide-up overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Nombre</TableHead>
                  <TableHead className="min-w-[200px]">Descripción</TableHead>
                  <TableHead className="min-w-[120px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nombre}</TableCell>
                    <TableCell>{item.descripcion}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Editar
                      </Button>
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
      {ConfirmDialog}
    </MainLayout>
  );
};

export default {{Name}};