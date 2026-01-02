import type {
  ConfiguracionEmpresa,
  ConfiguracionNotificaciones,
  ConfiguracionSistema,
  ApiResponse,
} from "@/services/types";

class ConfigService {
  // Obtener configuración de empresa
  async getEmpresaConfig(userId: string): Promise<ApiResponse<ConfiguracionEmpresa>> {
    try {
      // NOTE: Tabla no existe en Supabase, usando datos mock
      const mockData: ConfiguracionEmpresa = {
        id: "1",
        user_id: userId,
        nombre_empresa: "Granjas Giordano",
        rif_nit: "J-123456789",
        telefono: "+58 412 123 4567",
        email: "info@granjasgiordano.com",
        direccion: "Av. Principal, Ciudad Bolívar, Venezuela",
        logo_url: "/logo.jpg",
      };

      return { data: mockData, error: null };
    } catch {
      return { data: null, error: "Error al obtener configuración de empresa" };
    }
  }

  // Actualizar configuración de empresa
  async updateEmpresaConfig(
    config: Partial<ConfiguracionEmpresa>
  ): Promise<ApiResponse<ConfiguracionEmpresa>> {
    try {
      // NOTE: Tabla no existe en Supabase, simulando actualización
      const updatedData: ConfiguracionEmpresa = {
        id: "1",
        user_id: config.user_id || "",
        nombre_empresa: config.nombre_empresa || "Granjas Giordano",
        rif_nit: config.rif_nit || "J-123456789",
        telefono: config.telefono || "+58 412 123 4567",
        email: config.email || "info@granjasgiordano.com",
        direccion: config.direccion || "Av. Principal, Ciudad Bolívar, Venezuela",
        logo_url: config.logo_url || "/logo.jpg",
      };

      return { data: updatedData, error: null };
    } catch {
      return { data: null, error: "Error al actualizar configuración de empresa" };
    }
  }

  // Obtener configuración de notificaciones
  async getNotificacionesConfig(userId: string): Promise<ApiResponse<ConfiguracionNotificaciones>> {
    try {
      // NOTE: Tabla no existe en Supabase, usando datos mock
      const mockData: ConfiguracionNotificaciones = {
        id: "1",
        user_id: userId,
        stock_bajo: true,
        facturas_vencidas: true,
        nuevas_ventas: false,
      };

      return { data: mockData, error: null };
    } catch {
      return { data: null, error: "Error al obtener configuración de notificaciones" };
    }
  }

  // Actualizar configuración de notificaciones
  async updateNotificacionesConfig(
    config: Partial<ConfiguracionNotificaciones>
  ): Promise<ApiResponse<ConfiguracionNotificaciones>> {
    try {
      // NOTE: Tabla no existe en Supabase, simulando actualización
      const updatedData: ConfiguracionNotificaciones = {
        id: "1",
        user_id: config.user_id || "",
        stock_bajo: config.stock_bajo ?? true,
        facturas_vencidas: config.facturas_vencidas ?? true,
        nuevas_ventas: config.nuevas_ventas ?? false,
      };

      return { data: updatedData, error: null };
    } catch {
      return { data: null, error: "Error al actualizar configuración de notificaciones" };
    }
  }

  // Obtener configuración del sistema
  async getSistemaConfig(userId: string): Promise<ApiResponse<ConfiguracionSistema>> {
    try {
      // NOTE: Tabla no existe en Supabase, usando datos mock
      const mockData: ConfiguracionSistema = {
        id: "1",
        user_id: userId,
        version: "1.0.0",
        db_conectada: true,
        ultima_actualizacion: new Date().toISOString(),
        estado: "Operativo",
      };

      return { data: mockData, error: null };
    } catch {
      return { data: null, error: "Error al obtener configuración del sistema" };
    }
  }

  // Actualizar configuración del sistema
  async updateSistemaConfig(
    config: Partial<ConfiguracionSistema>
  ): Promise<ApiResponse<ConfiguracionSistema>> {
    try {
      // NOTE: Tabla no existe en Supabase, simulando actualización
      const updatedData: ConfiguracionSistema = {
        id: "1",
        user_id: config.user_id || "",
        version: config.version || "1.0.0",
        db_conectada: config.db_conectada ?? true,
        ultima_actualizacion: new Date().toISOString(),
        estado: config.estado || "Operativo",
      };

      return { data: updatedData, error: null };
    } catch {
      return { data: null, error: "Error al actualizar configuración del sistema" };
    }
  }
}

export const configService = new ConfigService();
