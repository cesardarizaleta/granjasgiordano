import { SupabaseWrapper } from "@/services/supabaseWrapper";
import type { Producto, ApiResponse, PaginatedResponse } from "@/services/types";
import { dolarService } from "@/services/dolarService";

class InventarioService {
  private readonly tableName = "inventario";

  // Obtener todos los productos (con paginación)
  async getProductos(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Producto>> {
    return SupabaseWrapper.selectPaginated<Producto>(SupabaseWrapper.from(this.tableName), {
      tableName: this.tableName,
      operation: "SELECT",
      pagination: {
        page,
        limit,
        orderBy: "fecha_creacion",
        orderDirection: "desc",
      },
      logLevel: "none",
      countStrategy: "planned",
      queryDescription: `getProductos page=${page} limit=${limit}`,
    });
  }

  // Obtener producto por ID
  async getProductoById(id: string): Promise<ApiResponse<Producto>> {
    return SupabaseWrapper.select<Producto>(
      SupabaseWrapper.from(this.tableName).select("*").eq("id", id).single(),
      {
        tableName: this.tableName,
        operation: "SELECT",
        logLevel: "none",
        queryDescription: `getProductoById id=${id}`,
      }
    );
  }

  // Crear producto
  async createProducto(productoData: Omit<Producto, "id">): Promise<ApiResponse<Producto>> {
    // Lógica de negocio: calcular precio en bolívares
    const dolarResponse = await dolarService.getDolarRates();
    const tasaActual = dolarResponse.data
      ? dolarService.getOficialRate(dolarResponse.data)
      : 298.14; // fallback

    const productoDataConBS = {
      ...productoData,
      precio_bs: productoData.precio * tasaActual,
    };

    return SupabaseWrapper.insert<Producto>(
      SupabaseWrapper.from(this.tableName).insert([productoDataConBS]).select().single(),
      {
        tableName: this.tableName,
        operation: "INSERT",
        logLevel: "critical",
        queryDescription: "createProducto",
      }
    );
  }

  // Actualizar producto
  async updateProducto(id: string, updates: Partial<Producto>): Promise<ApiResponse<Producto>> {
    // Lógica de negocio: recalcular precio BS si cambia el precio USD
    const updatesConBS = { ...updates };
    if (updates.precio !== undefined) {
      const dolarResponse = await dolarService.getDolarRates();
      const tasaActual = dolarResponse.data
        ? dolarService.getOficialRate(dolarResponse.data)
        : 298.14;
      updatesConBS.precio_bs = updates.precio * tasaActual;
    }

    return SupabaseWrapper.update<Producto>(
      SupabaseWrapper.from(this.tableName).update(updatesConBS).eq("id", id).select().single(),
      {
        tableName: this.tableName,
        operation: "UPDATE",
        logLevel: "critical",
        queryDescription: `updateProducto id=${id}`,
      }
    );
  }

  // Eliminar producto
  async deleteProducto(id: string): Promise<ApiResponse<null>> {
    return SupabaseWrapper.delete(SupabaseWrapper.from(this.tableName).delete().eq("id", id), {
      tableName: this.tableName,
      operation: "DELETE",
      logLevel: "critical",
      queryDescription: `deleteProducto id=${id}`,
    });
  }

  // Buscar productos
  async searchProductos(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Producto>> {
    return SupabaseWrapper.selectPaginated<Producto>(
      SupabaseWrapper.from(this.tableName).or(
        `nombre_producto.ilike.%${query}%,descripcion.ilike.%${query}%,categoria.ilike.%${query}%`
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
        logLevel: "none",
        countStrategy: "planned",
        queryDescription: `searchProductos query=${query}`,
      }
    );
  }

  // Obtener productos con stock bajo
  async getProductosStockBajo(): Promise<ApiResponse<Producto[]>> {
    return SupabaseWrapper.select<Producto[]>(
      SupabaseWrapper.from(this.tableName).select("*").lte("stock", 5),
      {
        tableName: this.tableName,
        operation: "SELECT",
        logLevel: "error",
        queryDescription: "getProductosStockBajo (stock <= 5)",
      }
    );
  }

  // Actualizar stock
  async updateStock(id: string, nuevoStock: number): Promise<ApiResponse<Producto>> {
    return SupabaseWrapper.update<Producto>(
      SupabaseWrapper.from(this.tableName)
        .update({ stock: nuevoStock })
        .eq("id", id)
        .select()
        .single(),
      {
        tableName: this.tableName,
        operation: "UPDATE",
        logLevel: "critical",
        queryDescription: `updateStock id=${id} nuevoStock=${nuevoStock}`,
      }
    );
  }
}

export const inventarioService = new InventarioService();
