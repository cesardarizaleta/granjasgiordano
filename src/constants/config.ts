import appConfigOverrides from "@/config/app-config.json";

type Primitive = string | number | boolean | null;
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Primitive ? T[K] : DeepPartial<T[K]>;
};

// Configuración base de la aplicación. Modifica app-config.json para personalizar sin tocar código.
const DEFAULT_APP_CONFIG = {
  BRAND: {
    NAME: "La Zulianita",
    SHORT_NAME: "Zulianita",
    TAGLINE: "Sistema ERP",
    FOOTER_TEXT: "Sistema de gestión empresarial • La Zulianita © 2025",
    LOGO_URL: "/logo-zulianita.jpg",
    PRIMARY_TEXT_CLASS: "text-primary",
    ACCENT_TEXT_CLASS: "text-accent",
    GRADIENT_FROM: "from-primary/20",
    GRADIENT_TO: "to-accent/20",
  },

  NAME: "La Zulianita",
  VERSION: "1.0.0",
  DESCRIPTION: "Sistema de gestión para La Zulianita",

  INVENTORY: {
    MIN_STOCK_ALERT: 5,
    DEFAULT_WEIGHT_UNIT: "kg",
    CAPACITY_MULTIPLIER: 1.5,
    MIN_CAPACITY_KG: 50000,
  },

  DASHBOARD: {
    RECENT_SALES_LIMIT: 10,
    CHART_MONTHS: 6,
    INVENTORY_CATEGORIES_LIMIT: 4,
  },

  FORMS: {
    DEBOUNCE_DELAY: 300,
    MAX_FILE_SIZE: 5 * 1024 * 1024,
  },

  API: {
    DEFAULT_TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
  },
} as const;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function mergeConfig<T>(base: T, overrides: DeepPartial<T>): T {
  if (!isPlainObject(base) || !isPlainObject(overrides)) {
    return (overrides !== undefined ? (overrides as T) : base) as T;
  }

  const result = { ...(base as Record<string, unknown>) } as Record<string, unknown>;

  Object.keys(overrides).forEach(key => {
    const overrideValue = overrides[key as keyof T];
    if (overrideValue === undefined) return;

    const baseValue = (base as Record<string, unknown>)[key];

    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = mergeConfig(baseValue, overrideValue as Record<string, unknown>);
    } else {
      result[key] = overrideValue as unknown;
    }
  });

  return result as T;
}

export type AppConfig = typeof DEFAULT_APP_CONFIG;

// Configuración final que combina defaults + overrides desde JSON.
export const APP_CONFIG: AppConfig = mergeConfig(DEFAULT_APP_CONFIG, appConfigOverrides);

// Unidades de medida
export const UNITS = {
  WEIGHT: {
    KG: "kg",
    GRAM: "g",
    TON: "ton",
  },
  CURRENCY: {
    USD: "USD",
    VES: "VES",
  },
} as const;

// Categorías por defecto de productos
export const DEFAULT_CATEGORIES = [
  "Carbón Vegetal",
  "Carbón Mineral",
  "Briquetas",
  "Carbón para Parrilla",
  "Otros",
] as const;
