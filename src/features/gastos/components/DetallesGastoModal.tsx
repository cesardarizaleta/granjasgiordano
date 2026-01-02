import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  User,
  FileText,
  CreditCard,
  Tag,
  MessageSquare,
} from "lucide-react";
import type { GastosType, CategoriaGasto, EstadoGasto, MetodoPago } from "../types/gastos";
import { usePriceFormatter } from "@/hooks/usePriceFormatter";

interface DetallesGastoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gasto: GastosType | null;
}

export const DetallesGastoModal: React.FC<DetallesGastoModalProps> = ({
  open,
  onOpenChange,
  gasto,
}) => {
  const { formatPrice } = usePriceFormatter();

  if (!gasto) return null;

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

  const getMetodoPagoLabel = (metodo: MetodoPago) => {
    const labels = {
      efectivo: "Efectivo",
      transferencia: "Transferencia",
      pago_movil: "Pago Móvil",
      cheque: "Cheque",
      tarjeta: "Tarjeta",
    };
    return labels[metodo];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Detalles del Gasto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Fecha del gasto
              </div>
              <p className="font-medium">
                {new Date(gasto.fecha_gasto).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="w-4 h-4" />
                Categoría
              </div>
              <Badge variant="outline">{getCategoriaLabel(gasto.categoria)}</Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                Monto
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatPrice(gasto.monto)} {gasto.moneda}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Estado
              </div>
              {getEstadoBadge(gasto.estado)}
            </div>
          </div>

          <Separator />

          {/* Detalles adicionales */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="w-4 h-4" />
                Descripción
              </div>
              <p className="text-sm bg-muted p-3 rounded-md">{gasto.descripcion}</p>
            </div>

            {gasto.beneficiario && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  Beneficiario
                </div>
                <p className="text-sm bg-muted p-3 rounded-md">{gasto.beneficiario}</p>
              </div>
            )}

            {gasto.referencia && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  Referencia
                </div>
                <p className="text-sm bg-muted p-3 rounded-md">{gasto.referencia}</p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="w-4 h-4" />
                Método de pago
              </div>
              <p className="text-sm bg-muted p-3 rounded-md">
                {getMetodoPagoLabel(gasto.metodo_pago)}
              </p>
            </div>

            {gasto.notas && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="w-4 h-4" />
                  Notas
                </div>
                <p className="text-sm bg-muted p-3 rounded-md">{gasto.notas}</p>
              </div>
            )}
          </div>

          {/* Información de auditoría */}
          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">Creado:</span>{" "}
              {new Date(gasto.fecha_creacion).toLocaleString("es-ES")}
            </div>
            {gasto.fecha_aprobacion && (
              <div>
                <span className="font-medium">Aprobado:</span>{" "}
                {new Date(gasto.fecha_aprobacion).toLocaleString("es-ES")}
              </div>
            )}
            {gasto.fecha_pago && (
              <div>
                <span className="font-medium">Pagado:</span>{" "}
                {new Date(gasto.fecha_pago).toLocaleString("es-ES")}
              </div>
            )}
            {gasto.updated_at && (
              <div>
                <span className="font-medium">Última actualización:</span>{" "}
                {new Date(gasto.updated_at).toLocaleString("es-ES")}
              </div>
            )}
          </div>

          {/* Comprobante */}
          {gasto.comprobante_url && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => window.open(gasto.comprobante_url, "_blank")}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                Ver Comprobante
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
