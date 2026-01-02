/**
 * Sistema de errores consistente para la aplicación
 */

export enum ErrorType {
  NETWORK = "NETWORK",
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  NOT_FOUND = "NOT_FOUND",
  SERVER = "SERVER",
  UNKNOWN = "UNKNOWN",
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: Record<string, unknown>;
  originalError?: Error;
}

/**
 * Utilidades para crear errores consistentes
 */
export class ErrorFactory {
  static network(
    message: string = "Error de conexión",
    details?: Record<string, unknown>
  ): AppError {
    return {
      type: ErrorType.NETWORK,
      message,
      details,
    };
  }

  static validation(
    message: string = "Datos inválidos",
    details?: Record<string, unknown>
  ): AppError {
    return {
      type: ErrorType.VALIDATION,
      message,
      details,
    };
  }

  static authentication(message: string = "Error de autenticación"): AppError {
    return {
      type: ErrorType.AUTHENTICATION,
      message,
    };
  }

  static authorization(message: string = "No tienes permisos para esta acción"): AppError {
    return {
      type: ErrorType.AUTHORIZATION,
      message,
    };
  }

  static notFound(resource: string = "recurso"): AppError {
    return {
      type: ErrorType.NOT_FOUND,
      message: `${resource} no encontrado`,
    };
  }

  static server(message: string = "Error del servidor", code?: string): AppError {
    return {
      type: ErrorType.SERVER,
      message,
      code,
    };
  }

  static unknown(error?: Error): AppError {
    return {
      type: ErrorType.UNKNOWN,
      message: "Ha ocurrido un error inesperado",
      originalError: error,
    };
  }

  /**
   * Convierte errores de Supabase a errores de aplicación
   */
  static fromSupabase(error: any): AppError {
    if (!error) return ErrorFactory.unknown();

    const message = error.message || "Error desconocido";

    // Errores de red/conexión
    if (message.includes("Failed to fetch") || message.includes("Network")) {
      return ErrorFactory.network("Error de conexión con el servidor");
    }

    // Errores de autenticación
    if (message.includes("Invalid login credentials") || message.includes("Email not confirmed")) {
      return ErrorFactory.authentication("Credenciales inválidas");
    }

    // Errores de permisos
    if (message.includes("permission denied") || message.includes("insufficient_privilege")) {
      return ErrorFactory.authorization();
    }

    // Errores de validación (unique constraints, etc.)
    if (message.includes("duplicate key") || message.includes("violates")) {
      return ErrorFactory.validation("Los datos ya existen o son inválidos");
    }

    // Errores del servidor
    return ErrorFactory.server(message);
  }

  /**
   * Convierte cualquier error a AppError
   */
  static fromUnknown(error: unknown): AppError {
    if (error instanceof Error) {
      return ErrorFactory.unknown(error);
    }

    if (typeof error === "string") {
      return ErrorFactory.unknown(new Error(error));
    }

    return ErrorFactory.unknown(new Error("Error desconocido"));
  }
}

/**
 * Hook para manejar errores en componentes
 */
export function useErrorHandler() {
  const handleError = (error: unknown) => {
    const appError = ErrorFactory.fromUnknown(error);

    // En desarrollo, loguear el error completo
    if (process.env.NODE_ENV === "development") {
      console.error("Error manejado:", appError);
    }

    // Aquí podrías enviar errores a un servicio de logging
    // logError(appError);

    return appError;
  };

  const getErrorMessage = (error: AppError): string => {
    // Aquí podrías traducir mensajes según el idioma
    return error.message;
  };

  return {
    handleError,
    getErrorMessage,
  };
}

/**
 * Mensajes de error user-friendly
 */
export const ERROR_MESSAGES = {
  [ErrorType.NETWORK]: "Verifica tu conexión a internet e intenta nuevamente",
  [ErrorType.VALIDATION]: "Revisa los datos e intenta nuevamente",
  [ErrorType.AUTHENTICATION]: "Verifica tus credenciales e intenta iniciar sesión",
  [ErrorType.AUTHORIZATION]: "No tienes permisos para realizar esta acción",
  [ErrorType.NOT_FOUND]: "El elemento que buscas no existe",
  [ErrorType.SERVER]: "Ha ocurrido un error en el servidor. Intenta más tarde",
  [ErrorType.UNKNOWN]: "Ha ocurrido un error inesperado. Intenta recargar la página",
} as const;

/**
 * Obtiene mensaje user-friendly para un tipo de error
 */
export function getUserFriendlyMessage(errorType: ErrorType): string {
  return ERROR_MESSAGES[errorType] || ERROR_MESSAGES[ErrorType.UNKNOWN];
}
