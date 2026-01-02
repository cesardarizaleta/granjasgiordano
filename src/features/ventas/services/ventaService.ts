import { supabase } from "@/integrations/supabase/client";
import { SupabaseWrapper } from "@/services/supabaseWrapper";
import type { Venta, VentaItem, ApiResponse, PaginatedResponse } from "@/services/types";
import { dolarService } from "@/services/dolarService";
import { loggingService, measureExecutionTime } from "../../logs/services/loggingService";

class VentaService {
  private readonly tableName = "ventas";

  // Obtener todas las ventas (con paginación)
  async getVentas(page: number = 1, limit: number = 10): Promise<PaginatedResponse<Venta>> {
    const response = await SupabaseWrapper.selectPaginated<
      Venta & { clientes?: { nombre: string } }
    >(
      SupabaseWrapper.from(this.tableName).select(
        `
        *,
        clientes:cliente_id (
          nombre
        )
      `
      ),
      {
        tableName: this.tableName,
        operation: "SELECT",
        pagination: {
          page,
          limit,
          orderBy: "fecha_venta",
          orderDirection: "desc",
        },
        logLevel: "none",
        countStrategy: "planned",
        queryDescription: `getVentas page=${page} limit=${limit}`,
      }
    );

    if (response.error) {
      return response;
    }

    // Transformar los datos para incluir el nombre del cliente
    const transformedData = (response.data || []).map(venta => ({
      ...venta,
      cliente: venta.clientes?.nombre || "Cliente desconocido",
    })) as Venta[];

    return {
      data: transformedData,
      count: response.count,
      error: null,
    };
  }

  // Obtener venta por ID con items
  async getVentaById(id: string): Promise<ApiResponse<{ venta: Venta; items: VentaItem[] }>> {
    try {
      const { data, error } = await supabase
        .from("ventas")
        .select(
          `
          *,
          clientes:cliente_id ( nombre ),
          venta_items (*)
        `
        )
        .eq("id", id)
        .single();

      if (error || !data) {
        return { data: null, error: error?.message || "Venta no encontrada" };
      }

      const venta = {
        ...data,
        cliente: data.clientes?.nombre || "Cliente desconocido",
      };

      return { data: { venta, items: data.venta_items || [] }, error: null };
    } catch {
      return { data: null, error: "Error al obtener venta" };
    }
  }

  // Crear venta
  async createVenta(
    ventaData: Omit<Venta, "id">,
    items: Omit<VentaItem, "id" | "venta_id">[]
  ): Promise<ApiResponse<Venta>> {
    return measureExecutionTime(
      async () => {
        try {
          // Obtener la tasa de cambio actual
          const dolarResponse = await dolarService.getDolarRates();
          const tasaActual = dolarResponse.data
            ? dolarService.getOficialRate(dolarResponse.data)
            : 298.14; // fallback a 298.14

          // Calcular montos en bolívares
          const ventaDataConBS = {
            ...ventaData,
            total_bs: ventaData.total * tasaActual,
            tasa_cambio_aplicada: tasaActual,
          };

          // Preparar items con montos en bolívares
          const itemsConBS = items.map(item => ({
            ...item,
            precio_unitario_bs: item.precio_unitario * tasaActual,
            subtotal_bs: item.subtotal * tasaActual,
          }));

          // Crear la venta
          const { data: venta, error: ventaError } = await supabase
            .from("ventas")
            .insert([ventaDataConBS])
            .select(
              `
            *,
            clientes:cliente_id (
              nombre
            )
          `
            )
            .single();

          if (ventaError) {
            return { data: null, error: ventaError.message };
          }

          // Crear los items de la venta
          if (itemsConBS.length > 0) {
            const itemsWithVentaId = itemsConBS.map(item => ({
              ...item,
              venta_id: venta.id,
            }));

            const { error: itemsError } = await supabase
              .from("venta_items")
              .insert(itemsWithVentaId);

            if (itemsError) {
              // Si falla la creación de items, eliminar la venta
              await supabase.from("ventas").delete().eq("id", venta.id);
              return { data: null, error: itemsError.message };
            }

            // Descontar stock del inventario con menos roundtrips
            const productosIds = itemsWithVentaId
              .map(item => item.producto_id)
              .filter(Boolean) as string[];

            if (productosIds.length > 0) {
              const { data: stocksActuales, error: fetchError } = await supabase
                .from("inventario")
                .select("id, stock")
                .in("id", productosIds);

              if (fetchError || !stocksActuales) {
                await supabase.from("venta_items").delete().eq("venta_id", venta.id);
                await supabase.from("ventas").delete().eq("id", venta.id);
                return {
                  data: null,
                  error: `Error al obtener stock del producto: ${fetchError?.message || "Producto no encontrado"}`,
                };
              }

              const stockMap = new Map(stocksActuales.map(item => [item.id, item.stock]));

              for (const item of itemsWithVentaId) {
                if (!item.producto_id) continue;
                const stockActual = stockMap.get(item.producto_id);
                if (stockActual === undefined || stockActual - item.cantidad < 0) {
                  await supabase.from("venta_items").delete().eq("venta_id", venta.id);
                  await supabase.from("ventas").delete().eq("id", venta.id);
                  return {
                    data: null,
                    error: `Stock insuficiente para el producto ${item.producto_id}`,
                  };
                }
                stockMap.set(item.producto_id, stockActual - item.cantidad);
              }

              const updates = Array.from(stockMap.entries()).map(([idProducto, nuevoStock]) =>
                supabase.from("inventario").update({ stock: nuevoStock }).eq("id", idProducto)
              );

              const updateResults = await Promise.all(updates);
              const failed = updateResults.find(result => result.error);
              if (failed?.error) {
                await supabase.from("venta_items").delete().eq("venta_id", venta.id);
                await supabase.from("ventas").delete().eq("id", venta.id);
                return { data: null, error: `Error al actualizar stock: ${failed.error.message}` };
              }
            }
          }

          const transformedVenta = {
            ...venta,
            cliente: venta.clientes?.nombre || "Cliente desconocido",
          };

          return { data: transformedVenta, error: null };
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Error al crear venta";
          await loggingService.logError(
            "ventas",
            "INSERT",
            errorMessage,
            "createVenta catch block"
          );
          return { data: null, error: errorMessage };
        }
      },
      "ventas",
      "INSERT"
    );
  }

  // Actualizar venta
  async updateVenta(id: string, updates: Partial<Venta>): Promise<ApiResponse<Venta>> {
    const response = await SupabaseWrapper.update<Venta & { clientes?: { nombre: string } }>(
      SupabaseWrapper.from(this.tableName)
        .update(updates)
        .eq("id", id)
        .select(
          `
          *,
          clientes:cliente_id (
            nombre
          )
        `
        )
        .single(),
      {
        tableName: this.tableName,
        operation: "UPDATE",
        logLevel: "critical",
        queryDescription: `updateVenta id=${id}`,
      }
    );

    if (response.error || !response.data) {
      return response as ApiResponse<Venta>;
    }

    const transformedVenta = {
      ...response.data,
      cliente: response.data.clientes?.nombre || "Cliente desconocido",
    } as Venta;

    return { data: transformedVenta, error: null };
  }

  // Eliminar venta
  async deleteVenta(id: string): Promise<ApiResponse<null>> {
    try {
      // Primero obtener los items para restaurar stock
      const { data: items, error: fetchError } = await supabase
        .from("venta_items")
        .select("producto_id, cantidad")
        .eq("venta_id", id);

      if (fetchError) {
        return { data: null, error: fetchError.message };
      }

      // Restaurar stock
      if (items && items.length > 0) {
        const productosIds = items.map(item => item.producto_id).filter(Boolean) as string[];
        const { data: stocksActuales, error: fetchStockError } = await supabase
          .from("inventario")
          .select("id, stock")
          .in("id", productosIds);

        if (fetchStockError || !stocksActuales) {
          return {
            data: null,
            error: `Error al obtener stock del producto: ${fetchStockError?.message || "Producto no encontrado"}`,
          };
        }

        const stockMap = new Map(stocksActuales.map(item => [item.id, item.stock]));

        for (const item of items) {
          if (!item.producto_id) continue;
          const stockActual = stockMap.get(item.producto_id) ?? 0;
          stockMap.set(item.producto_id, stockActual + item.cantidad);
        }

        const updates = Array.from(stockMap.entries()).map(([idProducto, nuevoStock]) =>
          supabase.from("inventario").update({ stock: nuevoStock }).eq("id", idProducto)
        );

        const updateResults = await Promise.all(updates);
        const failed = updateResults.find(result => result.error);
        if (failed?.error) {
          return { data: null, error: `Error al restaurar stock: ${failed.error.message}` };
        }
      }

      // Eliminar los items de la venta
      const { error: itemsError } = await supabase.from("venta_items").delete().eq("venta_id", id);

      if (itemsError) {
        return { data: null, error: itemsError.message };
      }

      // Luego eliminar la venta
      const { error: ventaError } = await supabase.from("ventas").delete().eq("id", id);

      if (ventaError) {
        return { data: null, error: ventaError.message };
      }

      return { data: null, error: null };
    } catch {
      return { data: null, error: "Error al eliminar venta" };
    }
  }

  // Buscar ventas
  async searchVentas(
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Venta>> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from("ventas")
        .select(
          `
          *,
          clientes:cliente_id (
            nombre
          )
        `,
          { count: "planned" }
        )
        .or(`id.ilike.%${query}%`)
        .range(from, to)
        .order("fecha_venta", { ascending: false });

      if (error) {
        return { data: [], count: 0, error: error.message };
      }

      // Transformar los datos para incluir el nombre del cliente
      const transformedData = (data || []).map(venta => ({
        ...venta,
        cliente: venta.clientes?.nombre || "Cliente desconocido",
      }));

      return {
        data: transformedData,
        count: count || 0,
        error: null,
      };
    } catch {
      return { data: [], count: 0, error: "Error al buscar ventas" };
    }
  }
}

export const ventaService = new VentaService();
