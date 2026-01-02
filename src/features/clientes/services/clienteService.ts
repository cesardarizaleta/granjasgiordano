import { clienteRepository } from "@/repositories";
import type { Cliente, ApiResponse, PaginatedResponse } from "@/services/types";

/**
 * Servicio de aplicación para clientes
 * Usa el repositorio para acceder a datos, manteniendo lógica de aplicación
 */
class ClienteService {
  // Obtener todos los clientes (con paginación)
  async getClientes(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Cliente>> {
    const result = await clienteRepository.getAll({
      page,
      limit,
      orderBy: "fecha_creacion",
      orderDirection: "desc",
    });

    return {
      data: result.data,
      count: result.count,
      error: result.error,
    };
  }

  // Obtener cliente por ID
  async getClienteById(id: string): Promise<ApiResponse<Cliente>> {
    const result = await clienteRepository.getById(id);

    return {
      data: result.data,
      error: result.error,
    };
  }

  // Crear cliente
  async createCliente(
    clienteData: Omit<Cliente, "id" | "fecha_creacion">
  ): Promise<ApiResponse<Cliente>> {
    // Lógica de aplicación: agregar campos por defecto
    const clienteConDefaults = {
      ...clienteData,
      user_id: clienteData.user_id, // Debería venir del contexto de autenticación
    };

    const result = await clienteRepository.create(clienteConDefaults);

    return {
      data: result.data,
      error: result.error,
    };
  }

  // Actualizar cliente
  async updateCliente(id: string, updates: Partial<Cliente>): Promise<ApiResponse<Cliente>> {
    const result = await clienteRepository.update(id, updates);

    return {
      data: result.data,
      error: result.error,
    };
  }

  // Eliminar cliente
  async deleteCliente(id: string): Promise<ApiResponse<null>> {
    const result = await clienteRepository.delete(id);

    return {
      data: result.data,
      error: result.error,
    };
  }

  // Buscar clientes
  async searchClientes(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Cliente>> {
    const result = await clienteRepository.search({
      query,
      page,
      limit,
    });

    return {
      data: result.data,
      count: result.count,
      error: result.error,
    };
  }
}

export const clienteService = new ClienteService();
