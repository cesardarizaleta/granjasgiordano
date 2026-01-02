import { supabase } from "@/integrations/supabase/client";
import type { ApiResponse, PaginatedResponse } from "./types";
import { loggingService, measureExecutionTime } from "@/features/logs/services/loggingService";
import type { PostgrestFilterBuilder, PostgrestQueryBuilder } from "@supabase/supabase-js";

/**
 * Niveles de logging para reducir overhead
 */
export type LogLevel = "none" | "error" | "critical" | "all";

/**
 * Opciones para operaciones de base de datos
 */
export interface DbOperationOptions {
  tableName: string;
  operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE";
  logLevel?: LogLevel; // Reducir logs en rutas calientes
  measureTime?: boolean; // Desactivado por defecto para minimizar overhead
  queryDescription?: string;
  countStrategy?: "planned" | "exact" | "none"; // Solo aplica a consultas paginadas
}

/**
 * Opciones para paginación
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

/**
 * Wrapper genérico para operaciones de Supabase
 * Maneja errores, logging y medición de tiempo automáticamente
 */
export class SupabaseWrapper {
  /**
   * Ejecuta una operación SELECT con manejo de errores y logging optimizado
   */
  static async select<T>(
    queryBuilder: PostgrestFilterBuilder<any, any, any>,
    options: DbOperationOptions
  ): Promise<ApiResponse<T>> {
    const executeQuery = async () => {
      try {
        const { data, error } = await queryBuilder;

        if (error) {
          // Solo loguear errores si el nivel lo indica
          if (
            options.logLevel === "error" ||
            options.logLevel === "critical" ||
            options.logLevel === "all"
          ) {
            await loggingService.logError(
              options.tableName,
              options.operation,
              error.message,
              options.queryDescription
            );
          }
          return { data: null, error: error.message };
        }

        // Solo loguear SELECT críticos (no listados generales)
        if (options.logLevel === "critical" || options.logLevel === "all") {
          await loggingService.logSelect(
            options.tableName,
            options.queryDescription || "SELECT query",
            Array.isArray(data) ? data.map((item: any) => item.id) : [data.id]
          );
        }

        return { data: data as T, error: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : `Error en ${options.operation}`;
        if (options.logLevel && options.logLevel !== "none") {
          await loggingService.logError(
            options.tableName,
            options.operation,
            errorMessage,
            options.queryDescription
          );
        }
        return { data: null, error: errorMessage };
      }
    };

    if (options.measureTime === true) {
      return measureExecutionTime(executeQuery, options.tableName, options.operation);
    }

    return executeQuery();
  }

  /**
   * Ejecuta una operación SELECT con paginación
   */
  static async selectPaginated<T>(
    queryBuilder: PostgrestQueryBuilder<any, any, any>,
    options: DbOperationOptions & { pagination: PaginationOptions }
  ): Promise<PaginatedResponse<T>> {
    const executeQuery = async () => {
      try {
        const {
          page,
          limit,
          orderBy = "fecha_creacion",
          orderDirection = "desc",
        } = options.pagination;
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const countStrategy = options.countStrategy || "planned";
        const selectWithCount =
          countStrategy === "none"
            ? queryBuilder.select("*")
            : queryBuilder.select("*", {
                count: countStrategy === "exact" ? "exact" : "planned",
              });

        const { data, error, count } = await selectWithCount
          .order(orderBy, { ascending: orderDirection === "asc" })
          .range(from, to);

        if (error) {
          if (
            options.logLevel === "error" ||
            options.logLevel === "critical" ||
            options.logLevel === "all"
          ) {
            await loggingService.logError(
              options.tableName,
              options.operation,
              error.message,
              options.queryDescription || `get${options.tableName} page=${page} limit=${limit}`
            );
          }
          return { data: [], count: 0, error: error.message };
        }

        if (data && (options.logLevel === "critical" || options.logLevel === "all")) {
          await loggingService.logSelect(
            options.tableName,
            options.queryDescription || `get${options.tableName} page=${page} limit=${limit}`,
            data.map((item: any) => item.id)
          );
        }

        return {
          data: (data || []) as T[],
          count: countStrategy === "none" ? 0 : count || 0,
          error: null,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : `Error en ${options.operation}`;
        if (options.logLevel && options.logLevel !== "none") {
          await loggingService.logError(
            options.tableName,
            options.operation,
            errorMessage,
            options.queryDescription
          );
        }
        return { data: [], count: 0, error: errorMessage };
      }
    };

    if (options.measureTime === true) {
      return measureExecutionTime(executeQuery, options.tableName, options.operation);
    }

    return executeQuery();
  }

  /**
   * Ejecuta una operación INSERT
   */
  static async insert<T>(
    queryBuilder: PostgrestFilterBuilder<any, any, any>,
    options: DbOperationOptions
  ): Promise<ApiResponse<T>> {
    const executeQuery = async () => {
      try {
        const { data, error } = await queryBuilder;

        if (error) {
          if (
            options.logLevel === "error" ||
            options.logLevel === "critical" ||
            options.logLevel === "all"
          ) {
            await loggingService.logError(
              options.tableName,
              options.operation,
              error.message,
              options.queryDescription
            );
          }
          return { data: null, error: error.message };
        }

        // INSERT, UPDATE, DELETE se registran automáticamente por triggers en la BD
        // Solo logueamos SELECT manualmente

        return { data: (Array.isArray(data) ? data[0] : data) as T, error: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : `Error en ${options.operation}`;
        if (options.logLevel && options.logLevel !== "none") {
          await loggingService.logError(
            options.tableName,
            options.operation,
            errorMessage,
            options.queryDescription
          );
        }
        return { data: null, error: errorMessage };
      }
    };

    if (options.measureTime === true) {
      return measureExecutionTime(executeQuery, options.tableName, options.operation);
    }

    return executeQuery();
  }

  /**
   * Ejecuta una operación UPDATE
   */
  static async update<T>(
    queryBuilder: PostgrestFilterBuilder<any, any, any>,
    options: DbOperationOptions
  ): Promise<ApiResponse<T>> {
    const executeQuery = async () => {
      try {
        const { data, error } = await queryBuilder;

        if (error) {
          if (
            options.logLevel === "error" ||
            options.logLevel === "critical" ||
            options.logLevel === "all"
          ) {
            await loggingService.logError(
              options.tableName,
              options.operation,
              error.message,
              options.queryDescription
            );
          }
          return { data: null, error: error.message };
        }

        // INSERT, UPDATE, DELETE se registran automáticamente por triggers en la BD
        // Solo logueamos SELECT manualmente

        return { data: (Array.isArray(data) ? data[0] : data) as T, error: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : `Error en ${options.operation}`;
        if (options.logLevel && options.logLevel !== "none") {
          await loggingService.logError(
            options.tableName,
            options.operation,
            errorMessage,
            options.queryDescription
          );
        }
        return { data: null, error: errorMessage };
      }
    };

    if (options.measureTime === true) {
      return measureExecutionTime(executeQuery, options.tableName, options.operation);
    }

    return executeQuery();
  }

  /**
   * Ejecuta una operación DELETE
   */
  static async delete(
    queryBuilder: PostgrestFilterBuilder<any, any, any>,
    options: DbOperationOptions
  ): Promise<ApiResponse<null>> {
    const executeQuery = async () => {
      try {
        const { error } = await queryBuilder;

        if (error) {
          if (
            options.logLevel === "error" ||
            options.logLevel === "critical" ||
            options.logLevel === "all"
          ) {
            await loggingService.logError(
              options.tableName,
              options.operation,
              error.message,
              options.queryDescription
            );
          }
          return { data: null, error: error.message };
        }

        // INSERT, UPDATE, DELETE se registran automáticamente por triggers en la BD
        // Solo logueamos SELECT manualmente

        return { data: null, error: null };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : `Error en ${options.operation}`;
        if (options.logLevel && options.logLevel !== "none") {
          await loggingService.logError(
            options.tableName,
            options.operation,
            errorMessage,
            options.queryDescription
          );
        }
        return { data: null, error: errorMessage };
      }
    };

    if (options.measureTime === true) {
      return measureExecutionTime(executeQuery, options.tableName, options.operation);
    }

    return executeQuery();
  }

  /**
   * Helper para obtener el query builder de una tabla
   */
  static from(tableName: string) {
    return supabase.from(tableName);
  }
}
