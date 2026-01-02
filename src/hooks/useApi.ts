import { useState, useCallback, useEffect } from "react";
import type { ApiResponse, PaginatedResponse } from "@/services/types";

/**
 * Opciones simplificadas para el hook useApi
 */
export interface UseApiOptions<T> {
  /** Función que ejecuta la llamada a la API */
  apiFunction: () => Promise<ApiResponse<T> | PaginatedResponse<T>>;
  /** Si es true, ejecuta la función automáticamente al montar */
  immediate?: boolean;
  /** Callback cuando la llamada es exitosa */
  onSuccess?: (data: T | T[]) => void;
  /** Callback cuando hay un error */
  onError?: (error: string) => void;
}

/**
 * Estado simplificado del hook useApi
 */
export interface UseApiState<T> {
  data: T | T[] | null;
  loading: boolean;
  error: string | null;
  /** Función para ejecutar la llamada manualmente */
  execute: () => Promise<void>;
  /** Función para resetear el estado */
  reset: () => void;
}

/**
 * Hook simplificado para manejar llamadas a API
 * Elimina opciones complejas como cache, intervalos y refetch automático
 * para mantener simplicidad y usar React Query para esas funcionalidades
 *
 * @example
 * ```tsx
 * const { data, loading, error, execute } = useApi({
 *   apiFunction: () => inventarioService.getProductos(1, 10),
 *   immediate: true,
 * });
 * ```
 */
export function useApi<T>(options: UseApiOptions<T>): UseApiState<T> {
  const { apiFunction, immediate = false, onSuccess, onError } = options;

  const [data, setData] = useState<T | T[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Ejecuta la llamada a la API
   */
  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiFunction();

      if (response.error) {
        setError(response.error);
        setLoading(false);
        onError?.(response.error);
        return;
      }

      // Extraer data según el tipo de respuesta
      const responseData = "count" in response ? response.data : response.data;

      setData(responseData as T | T[]);
      setLoading(false);
      onSuccess?.(responseData as T | T[]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      setLoading(false);
      onError?.(errorMessage);
    }
  }, [apiFunction, onSuccess, onError]);

  /**
   * Resetea el estado
   */
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  // Ejecutar inmediatamente si está configurado
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, []); // Solo ejecutar una vez al montar

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}

/**
 * Hook especializado para respuestas paginadas
 */
export function usePaginatedApi<T>(
  options: Omit<UseApiOptions<T[]>, "apiFunction"> & {
    apiFunction: () => Promise<PaginatedResponse<T>>;
  }
) {
  const apiState = useApi<T[]>(options);

  return {
    ...apiState,
    // El data ya es un array en este caso
    data: apiState.data as T[] | null,
  };
}
