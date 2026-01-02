import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, X, FileText } from "lucide-react";
import { gastosService } from "../services/gastosService";
import type { GastosType, GastosFormData, CategoriaGasto, MetodoPago } from "../types/gastos";

interface EditarGastoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gasto: GastosType | null;
  onSuccess: () => void;
}

export const EditarGastoModal: React.FC<EditarGastoModalProps> = ({
  open,
  onOpenChange,
  gasto,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<GastosFormData>({
    fecha_gasto: "",
    descripcion: "",
    categoria: "otros",
    monto: 0,
    moneda: "VES",
    beneficiario: "",
    referencia: "",
    metodo_pago: "efectivo",
    notas: "",
    comprobante: undefined,
  });

  // Cargar datos del gasto cuando se abre el modal
  useEffect(() => {
    if (gasto && open) {
      setFormData({
        fecha_gasto: gasto.fecha_gasto.split("T")[0], // Convertir a formato YYYY-MM-DD
        descripcion: gasto.descripcion,
        categoria: gasto.categoria,
        monto: gasto.monto,
        moneda: gasto.moneda,
        beneficiario: gasto.beneficiario || "",
        referencia: gasto.referencia || "",
        metodo_pago: gasto.metodo_pago,
        notas: gasto.notas || "",
        comprobante: undefined, // No pre-llenar archivo
      });
    }
  }, [gasto, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gasto) return;

    setLoading(true);
    try {
      const response = await gastosService.updateGasto(gasto.id, formData);
      if (!response.error) {
        onSuccess();
        onOpenChange(false);
      } else {
        console.error("Error updating gasto:", response.error);
      }
    } catch (error) {
      console.error("Error updating gasto:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert(
          "Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, GIF, WebP) y PDFs."
        );
        return;
      }

      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        alert("El archivo es demasiado grande. Máximo 5MB.");
        return;
      }

      setFormData(prev => ({ ...prev, comprobante: file }));
    }
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, comprobante: undefined }));
  };

  if (!gasto) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Gasto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_gasto">Fecha del Gasto *</Label>
              <Input
                id="fecha_gasto"
                type="date"
                value={formData.fecha_gasto}
                onChange={e => setFormData(prev => ({ ...prev, fecha_gasto: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría *</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value: CategoriaGasto) =>
                  setFormData(prev => ({ ...prev, categoria: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
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

            <div className="space-y-2">
              <Label htmlFor="monto">Monto *</Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                min="0"
                value={formData.monto}
                onChange={e =>
                  setFormData(prev => ({ ...prev, monto: parseFloat(e.target.value) || 0 }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="moneda">Moneda *</Label>
              <Select
                value={formData.moneda}
                onValueChange={(value: "VES" | "USD") =>
                  setFormData(prev => ({ ...prev, moneda: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VES">Bolívares (VES)</SelectItem>
                  <SelectItem value="USD">Dólares (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={e => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Describe el gasto..."
              required
            />
          </div>

          {/* Información adicional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="beneficiario">Beneficiario</Label>
              <Input
                id="beneficiario"
                value={formData.beneficiario}
                onChange={e => setFormData(prev => ({ ...prev, beneficiario: e.target.value }))}
                placeholder="A quién se le pagó"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referencia">Referencia</Label>
              <Input
                id="referencia"
                value={formData.referencia}
                onChange={e => setFormData(prev => ({ ...prev, referencia: e.target.value }))}
                placeholder="Número de factura, recibo, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metodo_pago">Método de Pago *</Label>
              <Select
                value={formData.metodo_pago}
                onValueChange={(value: MetodoPago) =>
                  setFormData(prev => ({ ...prev, metodo_pago: value }))
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

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={formData.notas}
              onChange={e => setFormData(prev => ({ ...prev, notas: e.target.value }))}
              placeholder="Notas adicionales..."
            />
          </div>

          {/* Comprobante */}
          <div className="space-y-2">
            <Label>Comprobante</Label>
            {gasto.comprobante_url && !formData.comprobante && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <FileText className="w-4 h-4" />
                <span className="text-sm">Comprobante actual: </span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => window.open(gasto.comprobante_url, "_blank")}
                  className="p-0 h-auto"
                >
                  Ver actual
                </Button>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                id="comprobante"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <Label htmlFor="comprobante" className="flex items-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                {formData.comprobante ? formData.comprobante.name : "Seleccionar archivo"}
              </Label>
              {formData.comprobante && (
                <Button type="button" variant="ghost" size="sm" onClick={removeFile}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos permitidos: JPEG, PNG, GIF, WebP, PDF. Máximo 5MB.
            </p>
          </div>

          {/* Estado actual */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <span className="text-sm font-medium">Estado actual:</span>
            <Badge variant="outline">{gasto.estado}</Badge>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Actualizar Gasto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
