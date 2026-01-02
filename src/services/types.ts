// Tipos genéricos para la API, independientes de la implementación (Supabase, etc.)
export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  telefono?: string;
  avatar_url?: string;
  role?: "admin" | "vendedor" | "cobrador";
}

export interface Cliente {
  id: string;
  nombre: string;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  fecha_creacion: string;
  user_id: string;
}

export interface Producto {
  id: string;
  nombre_producto: string;
  descripcion?: string | null;
  precio: number; // Precio en USD
  precio_bs: number; // Precio en bolívares
  stock: number;
  peso?: number | null; // Peso en kg, opcional
  categoria?: string | null;
  fecha_creacion: string;
  user_id: string;
}

export interface Venta {
  id: string;
  cliente_id?: string;
  cliente?: string; // Nombre del cliente para búsqueda
  fecha_venta: string;
  total: number; // Total en USD
  total_bs: number; // Total en bolívares
  tasa_cambio_aplicada: number; // Tasa de cambio usada
  estado: string;
  user_id: string;
}

export interface VentaItem {
  id: string;
  venta_id: string;
  producto_id?: string;
  cantidad: number;
  precio_unitario: number; // Precio unitario en USD
  precio_unitario_bs: number; // Precio unitario en bolívares
  subtotal: number; // Subtotal en USD
  subtotal_bs: number; // Subtotal en bolívares
}

export interface Cobranza {
  id: string;
  venta_id: string;
  monto_pendiente: number; // Monto pendiente en USD
  monto_pendiente_bs: number; // Monto pendiente en bolívares
  fecha_vencimiento?: string;
  estado: string;
  notas?: string;
  user_id: string;
}

export interface ConfiguracionEmpresa {
  id: string;
  nombre_empresa: string;
  rif_nit: string;
  telefono: string;
  email: string;
  direccion: string;
  logo_url?: string;
  user_id: string;
}

export interface ConfiguracionNotificaciones {
  id: string;
  stock_bajo: boolean;
  facturas_vencidas: boolean;
  nuevas_ventas: boolean;
  user_id: string;
}

export interface ConfiguracionSistema {
  id: string;
  version: string;
  db_conectada: boolean;
  ultima_actualizacion: string;
  estado: string;
  user_id: string;
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  warning?: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  error: string | null;
}
