// Tipos específicos para Gastos
export interface Gastos {
  id: string;
  fecha_creacion: string;
  fecha_gasto: string;
  descripcion: string;
  categoria: CategoriaGasto;
  monto: number;
  moneda: "VES" | "USD";
  beneficiario?: string; // A quién se le pagó
  referencia?: string; // Número de factura, recibo, etc.
  metodo_pago: MetodoPago;
  estado: EstadoGasto;
  notas?: string;
  usuario_id: string; // Quién registró el gasto
  comprobante_url?: string; // URL del archivo adjunto
  aprobado_por?: string;
  fecha_aprobacion?: string;
  pagado_por?: string;
  fecha_pago?: string;
  updated_at?: string;
}

// Categorías de gastos
export type CategoriaGasto =
  | "operativos" // Gastos operativos
  | "administrativos" // Gastos administrativos
  | "mantenimiento" // Mantenimiento y reparaciones
  | "transporte" // Transporte y movilidad
  | "suministros" // Suministros y materiales
  | "servicios_publicos" // Servicios públicos
  | "marketing" // Marketing y publicidad
  | "salarios" // Salarios y remuneraciones
  | "impuestos" // Impuestos y tasas
  | "otros"; // Otros gastos

// Métodos de pago
export type MetodoPago = "efectivo" | "transferencia" | "pago_movil" | "cheque" | "tarjeta";

// Estados del gasto
export type EstadoGasto = "pendiente" | "aprobado" | "rechazado" | "pagado" | "cancelado";

// Tipos adicionales para formularios
export interface GastosFormData {
  fecha_gasto: string;
  descripcion: string;
  categoria: CategoriaGasto;
  monto: number;
  moneda: "VES" | "USD";
  beneficiario?: string;
  referencia?: string;
  metodo_pago: MetodoPago;
  notas?: string;
  comprobante?: File; // Para subir archivos
}

// Estadísticas y reportes
export interface GastosStats {
  total_mes: number;
  total_categoria: Record<CategoriaGasto, number>;
  gastos_pendientes: number;
  gastos_aprobados: number;
}

// Filtros para búsqueda
export interface GastosFilters {
  fecha_desde?: string;
  fecha_hasta?: string;
  categoria?: CategoriaGasto;
  estado?: EstadoGasto;
  beneficiario?: string;
}
