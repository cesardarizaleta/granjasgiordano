import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { clienteService } from "@/services";
import { useToast } from "@/hooks/use-toast";

interface NuevoClienteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NuevoClienteModal({ open, onOpenChange }: NuevoClienteModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleAddClient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const clientData = {
      nombre: formData.get("nombre") as string,
      email: formData.get("email") as string,
      telefono: formData.get("telefono") as string,
      direccion: formData.get("direccion") as string,
    };

    setLoading(true);
    try {
      const response = await clienteService.createCliente(clientData);
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cliente registrado",
          description: "El cliente ha sido registrado exitosamente.",
        });
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error creating client:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar el cliente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Registrar Nuevo Cliente</DialogTitle>
          <DialogDescription>Ingresa los datos del nuevo cliente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddClient} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre / Razón Social</Label>
            <Input id="nombre" name="nombre" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" name="telefono" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección</Label>
            <Input id="direccion" name="direccion" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Registrando..." : "Registrar Cliente"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
