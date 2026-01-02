// Constantes de paginación por módulo
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  LOGS_PAGE_SIZE: 20,
  DASHBOARD_RECENT_ITEMS: 10,
  DASHBOARD_CHART_MONTHS: 6,
  INVENTORY_STATUS_CATEGORIES: 4,
} as const;

// Configuración específica por módulo
export const MODULE_CONFIG = {
  clientes: {
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
    searchDebounce: 300,
  },
  inventario: {
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
    searchDebounce: 300,
  },
  ventas: {
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
    searchDebounce: 300,
  },
  cobranza: {
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
    searchDebounce: 300,
  },
  logs: {
    pageSize: PAGINATION.LOGS_PAGE_SIZE,
    searchDebounce: 300,
  },
} as const;
