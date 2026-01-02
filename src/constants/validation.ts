// Validaciones y límites
export const VALIDATION = {
  // Límites de texto
  TEXT: {
    MIN_NAME_LENGTH: 2,
    MAX_NAME_LENGTH: 100,
    MAX_DESCRIPTION_LENGTH: 500,
    MAX_EMAIL_LENGTH: 255,
    MAX_PHONE_LENGTH: 20,
    MAX_ADDRESS_LENGTH: 255,
  },

  // Límites numéricos
  NUMBERS: {
    MIN_PRICE: 0.01,
    MAX_PRICE: 999999.99,
    MIN_STOCK: 0,
    MAX_STOCK: 999999,
    MIN_WEIGHT: 0.01,
    MAX_WEIGHT: 9999.99,
  },

  // Patrones de validación
  PATTERNS: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[+]?[0-9\s\-()]{7,20}$/,
    PRICE: /^\d+(\.\d{1,2})?$/,
    WEIGHT: /^\d+(\.\d{1,2})?$/,
  },

  // Mensajes de error
  MESSAGES: {
    REQUIRED: "Este campo es obligatorio",
    INVALID_EMAIL: "Correo electrónico inválido",
    INVALID_PHONE: "Número de teléfono inválido",
    INVALID_PRICE: "Precio inválido",
    INVALID_WEIGHT: "Peso inválido",
    MIN_LENGTH: (field: string, min: number) => `${field} debe tener al menos ${min} caracteres`,
    MAX_LENGTH: (field: string, max: number) => `${field} no puede exceder ${max} caracteres`,
    MIN_VALUE: (field: string, min: number) => `${field} debe ser mayor a ${min}`,
    MAX_VALUE: (field: string, max: number) => `${field} no puede exceder ${max}`,
  },
} as const;
