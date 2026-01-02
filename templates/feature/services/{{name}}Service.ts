import { supabase } from "@/integrations/supabase/client";
import type { {{Name}}, ApiResponse, PaginatedResponse } from "@/services/types";

class {{Name}}Service {
  // Obtener todos los {{name}}s (con paginación)
  async get{{Name}}s(page: number = 1, limit: number = 10): Promise<PaginatedResponse<{{Name}}>> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from("{{name}}s")
        .select("*", { count: "exact" })
        .range(from, to)
        .order("fecha_creacion", { ascending: false });

      if (error) {
        console.error("Error fetching {{name}}s:", error);
        return { data: [], count: 0, error: error.message };
      }

      return {
        data: data || [],
        count: count || 0,
        error: null,
      };
    } catch (err) {
      console.error("Error in get{{Name}}s:", err);
      return { data: [], count: 0, error: "Error al obtener {{name}}s" };
    }
  }

  // Obtener {{name}} por ID
  async get{{Name}}ById(id: string): Promise<ApiResponse<{{Name}}>> {
    try {
      const { data, error } = await supabase.from("{{name}}s").select("*").eq("id", id).single();

      if (error) {
        console.error("Error fetching {{name}}:", error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error("Error in get{{Name}}ById:", err);
      return { data: null, error: "Error al obtener {{name}}" };
    }
  }

  // Crear {{name}}
  async create{{Name}}(data: Omit<{{Name}}, "id" | "fecha_creacion">): Promise<ApiResponse<{{Name}}>> {
    try {
      const { data: result, error } = await supabase
        .from("{{name}}s")
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error("Error creating {{name}}:", error);
        return { data: null, error: error.message };
      }

      return { data: result, error: null };
    } catch (err) {
      console.error("Error in create{{Name}}:", err);
      return { data: null, error: "Error al crear {{name}}" };
    }
  }

  // Actualizar {{name}}
  async update{{Name}}(id: string, data: Partial<{{Name}}>): Promise<ApiResponse<{{Name}}>> {
    try {
      const { data: result, error } = await supabase
        .from("{{name}}s")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating {{name}}:", error);
        return { data: null, error: error.message };
      }

      return { data: result, error: null };
    } catch (err) {
      console.error("Error in update{{Name}}:", err);
      return { data: null, error: "Error al actualizar {{name}}" };
    }
  }

  // Eliminar {{name}}
  async delete{{Name}}(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.from("{{name}}s").delete().eq("id", id);

      if (error) {
        console.error("Error deleting {{name}}:", error);
        return { data: null, error: error.message };
      }

      return { data: null, error: null };
    } catch (err) {
      console.error("Error in delete{{Name}}:", err);
      return { data: null, error: "Error al eliminar {{name}}" };
    }
  }
}

export const {{name}}Service = new {{Name}}Service();