import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Upload } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { gastosService } from "../services/gastosService";
import type { GastosFormData, CategoriaGasto, MetodoPago } from "../types/gastos";

interface NuevoGastoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const NuevoGastoModal: React.FC<NuevoGastoModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<GastosFormData>({
    fecha_gasto: new Date().toISOString().split("T")[0],
    descripcion: "",
    categoria: "operativos",
    monto: 0,
    moneda: "VES",
    beneficiario: "",
    metodo_pago: "efectivo",
    referencia: "",
    notas: "",
  });
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const gastoData = {
        ...formData,
        fecha_gasto: selectedDate.toISOString().split("T")[0],
        comprobante: comprobanteFile || undefined,
      };

      const response = await gastosService.createGasto(gastoData);

      if (!response.error) {
        // Mostrar warning si hubo problemas con el comprobante
        if (response.warning) {
          alert(`Gasto creado exitosamente, pero: ${response.warning}`);
        }

        onOpenChange(false);
        onSuccess?.();
        // Reset form
        setFormData({
          fecha_gasto: new Date().toISOString().split("T")[0],
          descripcion: "",
          categoria: "operativos",
          monto: 0,
          moneda: "VES",
          beneficiario: "",
          metodo_pago: "efectivo",
          referencia: "",
          notas: "",
        });
        setSelectedDate(new Date());
        setComprobanteFile(null);
      }
    } catch (error) {
      console.error("Error creating gasto:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamaño del archivo (máximo 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert("El archivo es demasiado grande. Máximo 10MB permitido.");
        return;
      }

      // Validar tipo de archivo
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Tipo de archivo no permitido. Solo imágenes (JPG, PNG, GIF, WebP) y PDFs.");
        return;
      }

      setComprobanteFile(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Gasto</DialogTitle>
          <DialogDescription>Registra un nuevo gasto en el sistema de tesorería.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha del Gasto</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={date => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value: CategoriaGasto) =>
                  setFormData({ ...formData, categoria: value, subcategoria: undefined })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
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
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="beneficiario">Beneficiario</Label>
            <Input
              id="beneficiario"
              placeholder="A quién se le pagó..."
              value={formData.beneficiario || ""}
              onChange={e => setFormData({ ...formData, beneficiario: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              placeholder="Describe el gasto..."
              value={formData.descripcion}
              onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
              required
              className="min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monto">Monto</Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                min="0"
                value={formData.monto}
                onChange={e => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="moneda">Moneda</Label>
              <Select
                value={formData.moneda}
                onValueChange={(value: "VES" | "USD") =>
                  setFormData({ ...formData, moneda: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VES">VES</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="metodo_pago">Método de Pago</Label>
              <Select
                value={formData.metodo_pago}
                onValueChange={(value: MetodoPago) =>
                  setFormData({ ...formData, metodo_pago: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="pago_movil">Pago Móvil</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referencia">Referencia (Factura/Recibo)</Label>
            <Input
              id="referencia"
              placeholder="Número de factura, recibo, etc."
              value={formData.referencia}
              onChange={e => setFormData({ ...formData, referencia: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comprobante">Comprobante (Opcional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="comprobante"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <Label
                htmlFor="comprobante"
                className="flex items-center gap-2 px-4 py-2 border border-input rounded-md cursor-pointer hover:bg-accent"
              >
                <Upload className="w-4 h-4" />
                {comprobanteFile ? comprobanteFile.name : "Seleccionar archivo"}
              </Label>
              {comprobanteFile && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setComprobanteFile(null)}
                >
                  Remover
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas (Opcional)</Label>
            <Textarea
              id="notas"
              placeholder="Notas adicionales..."
              value={formData.notas}
              onChange={e => setFormData({ ...formData, notas: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Gasto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
