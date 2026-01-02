import { SupabaseWrapper } from "@/services/supabaseWrapper";
import type { Cobranza, ApiResponse, PaginatedResponse } from "@/services/types";
import { dolarService } from "@/services/dolarService";

class CobranzaService {
  private readonly tableName = "cobranza";

  // Obtener todas las cobranzas (con paginación)
  async getCobranzas(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Cobranza>> {
    return SupabaseWrapper.selectPaginated<Cobranza>(SupabaseWrapper.from(this.tableName), {
      tableName: this.tableName,
      operation: "SELECT",
      pagination: {
        page,
        limit,
        orderBy: "id",
        orderDirection: "desc",
      },
      logLevel: "none",
      countStrategy: "planned",
      queryDescription: `getCobranzas page=${page} limit=${limit}`,
    });
  }

  // Obtener cobranza por ID
  async getCobranzaById(id: string): Promise<ApiResponse<Cobranza>> {
    return SupabaseWrapper.select<Cobranza>(
      SupabaseWrapper.from(this.tableName).select("*").eq("id", id).single(),
      {
        tableName: this.tableName,
        operation: "SELECT",
        logLevel: "none",
        queryDescription: `getCobranzaById id=${id}`,
      }
    );
  }

  // Crear cobranza
  async createCobranza(cobranzaData: Omit<Cobranza, "id">): Promise<ApiResponse<Cobranza>> {
    // Obtener la tasa de cambio actual
    const dolarResponse = await dolarService.getDolarRates();
    const tasaActual = dolarResponse.data
      ? dolarService.getOficialRate(dolarResponse.data)
      : 298.14;

    // Calcular monto pendiente en bolívares
    const cobranzaDataConBS = {
      ...cobranzaData,
      monto_pendiente_bs: cobranzaData.monto_pendiente * tasaActual,
    };

    return SupabaseWrapper.insert<Cobranza>(
      SupabaseWrapper.from(this.tableName).insert([cobranzaDataConBS]).select().single(),
      {
        tableName: this.tableName,
        operation: "INSERT",
        logLevel: "critical",
        queryDescription: "createCobranza",
      }
    );
  }

  // Actualizar cobranza
  async updateCobranza(id: string, updates: Partial<Cobranza>): Promise<ApiResponse<Cobranza>> {
    return SupabaseWrapper.update<Cobranza>(
      SupabaseWrapper.from(this.tableName).update(updates).eq("id", id).select().single(),
      {
        tableName: this.tableName,
        operation: "UPDATE",
        logLevel: "critical",
        queryDescription: `updateCobranza id=${id}`,
      }
    );
  }

  // Eliminar cobranza
  async deleteCobranza(id: string): Promise<ApiResponse<null>> {
    return SupabaseWrapper.delete(SupabaseWrapper.from(this.tableName).delete().eq("id", id), {
      tableName: this.tableName,
      operation: "DELETE",
      logLevel: "critical",
      queryDescription: `deleteCobranza id=${id}`,
    });
  }

  // Buscar cobranzas
  async searchCobranzas(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Cobranza>> {
    return SupabaseWrapper.selectPaginated<Cobranza>(
      SupabaseWrapper.from(this.tableName).or(`notas.ilike.%${query}%,estado.ilike.%${query}%`),
      {
        tableName: this.tableName,
        operation: "SELECT",
        pagination: {
          page,
          limit,
          orderBy: "id",
          orderDirection: "desc",
        },
        logLevel: "none",
        countStrategy: "planned",
        queryDescription: `searchCobranzas query=${query}`,
      }
    );
  }

  // Obtener cobranzas pendientes
  async getCobranzasPendientes(): Promise<ApiResponse<Cobranza[]>> {
    return SupabaseWrapper.select<Cobranza[]>(
      SupabaseWrapper.from(this.tableName)
        .select("*")
        .eq("estado", "pendiente")
        .order("fecha_vencimiento", { ascending: true }),
      {
        tableName: this.tableName,
        operation: "SELECT",
        logLevel: "none",
        queryDescription: "getCobranzasPendientes",
      }
    );
  }

  // Marcar como pagada
  async marcarComoPagada(id: string): Promise<ApiResponse<Cobranza>> {
    return SupabaseWrapper.update<Cobranza>(
      SupabaseWrapper.from(this.tableName)
        .update({ estado: "pagada" })
        .eq("id", id)
        .select()
        .single(),
      {
        tableName: this.tableName,
        operation: "UPDATE",
        logLevel: "critical",
        queryDescription: `marcarComoPagada id=${id}`,
      }
    );
  }
}

export const cobranzaService = new CobranzaService();
