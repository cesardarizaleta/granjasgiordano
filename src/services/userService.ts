import type { Usuario, ApiResponse, PaginatedResponse } from "./types";
import { loggingService, measureExecutionTime } from "../features/logs/services/loggingService";

class UserService {
  // Obtener todos los usuarios (por ahora mock, ya que Supabase Auth no permite listar usuarios desde frontend)
  async getUsers(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Usuario>> {
    return measureExecutionTime(
      async () => {
        try {
          // NOTE: En un entorno de producción, esto debería hacerse desde un backend
          // con permisos de admin. Por ahora, devolvemos usuarios mock con la estructura correcta

          // En el futuro, podríamos usar una tabla de perfiles de usuario
          // const { data, error, count } = await supabase
          //   .from('user_profiles')
          //   .select('*', { count: 'exact' })
          //   .range(from, to)
          //   .order('created_at', { ascending: false });

          // Datos mock para desarrollo
          const mockUsers: Usuario[] = [
            {
              id: "1",
              email: "admin@lazulianita.com",
              nombre: "Administrador",
              role: "admin",
            },
            {
              id: "2",
              email: "ventas@lazulianita.com",
              nombre: "Vendedor Principal",
              role: "vendedor",
            },
            {
              id: "3",
              email: "cobranza@lazulianita.com",
              nombre: "Cobrador",
              role: "cobrador",
            },
          ];

          const from = (page - 1) * limit;
          const to = from + limit;
          const paginatedUsers = mockUsers.slice(from, to);

          await loggingService.logSelect(
            "users",
            `getUsers page=${page} limit=${limit}`,
            paginatedUsers.map(u => u.id)
          );

          return {
            data: paginatedUsers,
            count: mockUsers.length,
            error: null,
          };
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Error al obtener usuarios";
          await loggingService.logError("users", "SELECT", errorMessage, "getUsers catch block");
          return { data: [], count: 0, error: errorMessage };
        }
      },
      "users",
      "SELECT"
    );
  }

  // Crear un nuevo usuario
  async createUser(userData: Omit<Usuario, "id">): Promise<ApiResponse<Usuario>> {
    return measureExecutionTime(
      async () => {
        try {
          // NOTE: La creación real de usuarios debería hacerse desde un backend
          // con permisos de admin para evitar que cualquier usuario cree cuentas

          // Por ahora, simulamos la creación
          const newUser: Usuario = {
            id: Date.now().toString(), // ID temporal
            ...userData,
          };

          await loggingService.logInsert("users", `createUser ${newUser.email}`, [newUser.id]);

          return { data: newUser, error: null };
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Error al crear usuario";
          await loggingService.logError("users", "INSERT", errorMessage, "createUser catch block");
          return { data: null, error: errorMessage };
        }
      },
      "users",
      "INSERT"
    );
  }

  // Actualizar usuario
  async updateUser(id: string, updates: Partial<Usuario>): Promise<ApiResponse<Usuario>> {
    return measureExecutionTime(
      async () => {
        try {
          // NOTE: La actualización real debería hacerse desde un backend
          // Por ahora, simulamos la actualización

          // En el futuro, podríamos actualizar una tabla de perfiles
          // const { data, error } = await supabase
          //   .from('user_profiles')
          //   .update(updates)
          //   .eq('id', id)
          //   .select()
          //   .single();

          const updatedUser: Usuario = {
            id,
            email: "updated@example.com", // mock
            nombre: updates.nombre || "Usuario Actualizado",
            role: updates.role || "vendedor",
            ...updates,
          };

          await loggingService.logUpdate("users", `updateUser ${id}`, [id]);

          return { data: updatedUser, error: null };
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Error al actualizar usuario";
          await loggingService.logError("users", "UPDATE", errorMessage, "updateUser catch block");
          return { data: null, error: errorMessage };
        }
      },
      "users",
      "UPDATE"
    );
  }

  // Eliminar usuario
  async deleteUser(id: string): Promise<ApiResponse<null>> {
    return measureExecutionTime(
      async () => {
        try {
          // NOTE: La eliminación real debería hacerse desde un backend
          // con permisos de admin

          // En el futuro, podríamos eliminar de una tabla de perfiles
          // const { error } = await supabase
          //   .from('user_profiles')
          //   .delete()
          //   .eq('id', id);

          await loggingService.logDelete("users", `deleteUser ${id}`, [id]);

          return { data: null, error: null };
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Error al eliminar usuario";
          await loggingService.logError("users", "DELETE", errorMessage, "deleteUser catch block");
          return { data: null, error: errorMessage };
        }
      },
      "users",
      "DELETE"
    );
  }

  // Buscar usuarios
  async searchUsers(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Usuario>> {
    return measureExecutionTime(
      async () => {
        try {
          // NOTE: La búsqueda real debería hacerse en el backend
          // Por ahora, filtramos los datos mock

          const mockUsers: Usuario[] = [
            {
              id: "1",
              email: "admin@lazulianita.com",
              nombre: "Administrador",
              role: "admin",
            },
            {
              id: "2",
              email: "ventas@lazulianita.com",
              nombre: "Vendedor Principal",
              role: "vendedor",
            },
            {
              id: "3",
              email: "cobranza@lazulianita.com",
              nombre: "Cobrador",
              role: "cobrador",
            },
          ];

          const filteredUsers = mockUsers.filter(
            user =>
              user.nombre.toLowerCase().includes(query.toLowerCase()) ||
              user.email.toLowerCase().includes(query.toLowerCase())
          );

          const from = (page - 1) * limit;
          const to = from + limit;
          const paginatedUsers = filteredUsers.slice(from, to);

          await loggingService.logSelect(
            "users",
            `searchUsers query=${query} page=${page}`,
            paginatedUsers.map(u => u.id)
          );

          return {
            data: paginatedUsers,
            count: filteredUsers.length,
            error: null,
          };
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Error al buscar usuarios";
          await loggingService.logError("users", "SELECT", errorMessage, "searchUsers catch block");
          return { data: [], count: 0, error: errorMessage };
        }
      },
      "users",
      "SELECT"
    );
  }
}

export const userService = new UserService();
