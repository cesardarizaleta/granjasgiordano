// Exportar todos los servicios y tipos
export * from "./types";
export { authService } from "../features/auth/services/authService";
export { clienteService } from "../features/clientes/services/clienteService";
export { inventarioService } from "../features/inventario/services/inventarioService";
export { ventaService } from "../features/ventas/services/ventaService";
export { cobranzaService } from "../features/cobranza/services/cobranzaService";
export { configService } from "../features/configuracion/services/configService";
export * from "./dolarService";
export { loggingService, measureExecutionTime } from "../features/logs/services/loggingService";
export * from "./userService";

export { gastosService } from "@/features/gastos/services/gastosService";

// Exportar wrapper genérico
export { SupabaseWrapper } from "./supabaseWrapper";
