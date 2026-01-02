import { SupabaseWrapper } from "@/services/supabaseWrapper";
import { ErrorFactory } from "@/lib/errors";
import type {
  IClienteRepository,
  RepositoryResponse,
  PaginatedRepositoryResponse,
  PaginationOptions,
  SearchOptions,
} from "./types";
import type { Cliente } from "@/services/types";

export class ClienteRepository implements IClienteRepository {
  private readonly tableName = "clientes";

  async getAll(options: PaginationOptions): Promise<PaginatedRepositoryResponse<Cliente>> {
    return SupabaseWrapper.selectPaginated<Cliente>(
      SupabaseWrapper.from(this.tableName).select("*"),
      {
        tableName: this.tableName,
        operation: "SELECT",
        pagination: options,
        logLevel: "none", // No loguear listados generales
        countStrategy: "planned",
        queryDescription: `getAllClientes page=${options.page} limit=${options.limit}`,
      }
    );
  }

  async getById(id: string): Promise<RepositoryResponse<Cliente>> {
    return SupabaseWrapper.select<Cliente>(
      SupabaseWrapper.from(this.tableName).select("*").eq("id", id).single(),
      {
        tableName: this.tableName,
        operation: "SELECT",
        logLevel: "none", // Operación común, no loguear
        queryDescription: `getClienteById id=${id}`,
      }
    );
  }

  async create(
    clienteData: Omit<Cliente, "id" | "fecha_creacion">
  ): Promise<RepositoryResponse<Cliente>> {
    try {
      const result = await SupabaseWrapper.insert<Cliente>(
        SupabaseWrapper.from(this.tableName).insert([clienteData]).select().single(),
        {
          tableName: this.tableName,
          operation: "INSERT",
          logLevel: "critical", // Operaciones de creación son críticas
          queryDescription: "createCliente",
        }
      );

      if (result.error) {
        return {
          data: null,
          error: ErrorFactory.fromSupabase({ message: result.error }).message,
        };
      }

      return result;
    } catch (error) {
      const appError = ErrorFactory.fromUnknown(error);
      return {
        data: null,
        error: appError.message,
      };
    }
  }

  async update(id: string, updates: Partial<Cliente>): Promise<RepositoryResponse<Cliente>> {
    return SupabaseWrapper.update<Cliente>(
      SupabaseWrapper.from(this.tableName).update(updates).eq("id", id).select().single(),
      {
        tableName: this.tableName,
        operation: "UPDATE",
        logLevel: "critical", // Operaciones de modificación son críticas
        queryDescription: `updateCliente id=${id}`,
      }
    );
  }

  async delete(id: string): Promise<RepositoryResponse<null>> {
    return SupabaseWrapper.delete(SupabaseWrapper.from(this.tableName).delete().eq("id", id), {
      tableName: this.tableName,
      operation: "DELETE",
      logLevel: "critical", // Operaciones de eliminación son críticas
      queryDescription: `deleteCliente id=${id}`,
    });
  }

  async search(options: SearchOptions): Promise<PaginatedRepositoryResponse<Cliente>> {
    const { query, page = 1, limit = 10 } = options;

    return SupabaseWrapper.selectPaginated<Cliente>(
      SupabaseWrapper.from(this.tableName).or(
        `nombre.ilike.%${query}%,email.ilike.%${query}%,telefono.ilike.%${query}%`
      ),
      {
        tableName: this.tableName,
        operation: "SELECT",
        pagination: {
          page,
          limit,
          orderBy: "fecha_creacion",
          orderDirection: "desc",
        },
        logLevel: "none", // Búsquedas no son críticas
        countStrategy: "planned",
        queryDescription: `searchClientes query=${query}`,
      }
    );
  }
}

// Instancia singleton del repositorio
export const clienteRepository = new ClienteRepository();
