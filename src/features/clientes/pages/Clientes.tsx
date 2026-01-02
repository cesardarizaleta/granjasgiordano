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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Edit, Trash2, Users, Phone, Mail, MapPin, Loader2 } from "lucide-react";
import { clienteService } from "@/services";
import type { Cliente } from "@/services";

import { MODULE_CONFIG } from "@/constants";
import { NuevoClienteModal } from "../components/NuevoClienteModal";

interface Client extends Cliente {
  tipo?: "regular" | "mayorista" | "vip";
  totalCompras?: number;
  ultimaCompra?: string;
}

const tipoBadgeVariant = {
  regular: "secondary",
  mayorista: "default",
  vip: "destructive",
} as const;

const Clientes = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = MODULE_CONFIG.clientes.pageSize;
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    loadClients();
  }, [currentPage]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await clienteService.getClientes(currentPage, pageSize);
      if (response.error) {
        setError(response.error);
      } else {
        // Mapear para agregar campos opcionales si es necesario
        const mappedClients: Client[] = response.data.map(client => ({
          ...client,
          tipo: "regular" as const, // Default, puedes calcular basado en totalCompras
          totalCompras: 0, // Calcular desde ventas si es necesario
          ultimaCompra: "-",
        }));
        setClients(mappedClients);
        setTotalPages(Math.ceil(response.count / pageSize));
      }
    } catch {
      setError("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(
    client =>
      client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (client: Client) => {
    setEditingClient(client);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Eliminar Cliente",
      description:
        "¿Estás seguro de que quieres eliminar este cliente? Esta acción no se puede deshacer.",
    });
    if (!confirmed) return;

    try {
      const response = await clienteService.deleteCliente(id);
      if (response.error) {
        setError(response.error);
      } else {
        setClients(clients.filter(c => c.id !== id));
      }
    } catch {
      setError("Error al eliminar cliente");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Clientes</h1>
            <p className="text-muted-foreground">Gestión de cartera de clientes</p>
          </div>
          <NuevoClienteModal
            onClientAdded={client => {
              const newClient: Client = {
                ...client,
                tipo: "regular",
                totalCompras: 0,
                ultimaCompra: "-",
              };
              setClients([...clients, newClient]);
            }}
            editingClient={editingClient}
            onClientUpdated={client => {
              setClients(
                clients.map(c =>
                  c.id === client.id ? { ...c, tipo: client.tipo || "regular" } : c
                )
              );
              setEditingClient(null);
            }}
          />
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes..."
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Badge variant="outline" className="px-4 py-2 h-10 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            {clients.length} clientes
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
            <span className="ml-2 text-muted-foreground">Cargando clientes...</span>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-sm animate-slide-up overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Cliente</TableHead>
                  <TableHead className="min-w-[150px]">Contacto</TableHead>
                  <TableHead className="min-w-[200px]">Dirección</TableHead>
                  <TableHead className="min-w-[100px]">Tipo</TableHead>
                  <TableHead className="min-w-[120px]">Total Compras</TableHead>
                  <TableHead className="min-w-[120px]">Última Compra</TableHead>
                  <TableHead className="min-w-[120px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No se encontraron clientes
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map(client => (
                    <TableRow key={client.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {getInitials(client.nombre)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{client.nombre}</p>
                            <p className="text-xs text-muted-foreground">{client.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            {client.email}
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {client.telefono}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          {client.direccion}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={tipoBadgeVariant[client.tipo]}>{client.tipo}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${client.totalCompras.toLocaleString()}
                      </TableCell>
                      <TableCell>{client.ultimaCompra}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(client.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
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
    </MainLayout>
  );
};

export default Clientes;
