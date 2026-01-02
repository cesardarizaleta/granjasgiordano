import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id?: string;
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  tipo?: "regular" | "mayorista" | "vip";
}

interface NuevoClienteModalProps {
  onClientAdded: (client: Client) => void;
  editingClient?: Client | null;
  onClientUpdated?: (client: Client) => void;
}

export const NuevoClienteModal = ({
  onClientAdded,
  editingClient,
  onClientUpdated,
}: NuevoClienteModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const clientData: Client = {
      nombre: formData.get("nombre") as string,
      email: formData.get("email") as string,
      telefono: formData.get("telefono") as string,
      direccion: formData.get("direccion") as string,
      tipo: (formData.get("tipo") as Client["tipo"]) || "regular",
    };

    // Obtener el usuario actual
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      alert("Debes iniciar sesión para crear clientes");
      return;
    }

    try {
      if (editingClient) {
        // Editar cliente existente
        const { data, error } = await supabase
          .from("clientes")
          .update({
            ...clientData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingClient.id)
          .select()
          .single();

        if (error) throw error;
        onClientUpdated?.(data);
      } else {
        // Crear nuevo cliente
        const { data, error } = await supabase
          .from("clientes")
          .insert({
            ...clientData,
            user_id: session.user.id,
          })
          .select()
          .single();

        if (error) throw error;
        onClientAdded(data);
      }

      setIsOpen(false);
    } catch (error) {
      console.error("Error saving client:", error);
      alert("Error al guardar el cliente");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {editingClient ? "Editar Cliente" : "Agregar Cliente"}
          </DialogTitle>
          <DialogDescription>
            {editingClient
              ? "Modifica los datos del cliente."
              : "Ingresa los datos del nuevo cliente."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre / Razón Social</Label>
            <Input id="nombre" name="nombre" defaultValue={editingClient?.nombre} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={editingClient?.email}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                name="telefono"
                defaultValue={editingClient?.telefono}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              name="direccion"
              defaultValue={editingClient?.direccion}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Cliente</Label>
            <select
              id="tipo"
              name="tipo"
              defaultValue={editingClient?.tipo || "regular"}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background"
            >
              <option value="regular">Regular</option>
              <option value="mayorista">Mayorista</option>
              <option value="vip">VIP</option>
            </select>
          </div>
          <Button type="submit" className="w-full">
            {editingClient ? "Guardar Cambios" : "Agregar Cliente"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
