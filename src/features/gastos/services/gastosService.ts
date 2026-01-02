import { supabase } from "@/integrations/supabase/client";
import { SupabaseWrapper } from "@/services/supabaseWrapper";
import type {
  Gastos,
  ApiResponse,
  PaginatedResponse,
  GastosFormData,
  CategoriaGasto,
  EstadoGasto,
} from "@/services/types";
import type {
  Gastos as GastosType,
  GastosFormData as GastosFormDataType,
  GastosStats as GastosStatsType,
  GastosFilters as GastosFiltersType,
} from "../types/gastos";

class GastosService {
  private readonly tableName = "gastos";

  // Helper para obtener URL pública de un comprobante
  private getComprobanteUrl(pathOrUrl: string): string {
    // Si ya es una URL completa de Supabase Storage, devolverla tal cual
    if (pathOrUrl.includes("supabase.co/storage/v1/object/public/")) {
      return pathOrUrl;
    }

    // Si es solo un path, obtener la URL pública completa
    const { data } = supabase.storage.from("comprobantes").getPublicUrl(pathOrUrl);

    return data.publicUrl;
  }

  // Obtener todos los gastos (con paginación y filtros)
  async getGastos(
    page: number = 1,
    limit: number = 10,
    filters?: GastosFiltersType
  ): Promise<PaginatedResponse<GastosType>> {
    let queryBuilder = SupabaseWrapper.from(this.tableName);

    // Aplicar filtros
    if (filters) {
      if (filters.fecha_desde) {
        queryBuilder = queryBuilder.gte("fecha_gasto", filters.fecha_desde);
      }
      if (filters.fecha_hasta) {
        queryBuilder = queryBuilder.lte("fecha_gasto", filters.fecha_hasta);
      }
      if (filters.categoria) {
        queryBuilder = queryBuilder.eq("categoria", filters.categoria);
      }
      if (filters.estado) {
        queryBuilder = queryBuilder.eq("estado", filters.estado);
      }
      if (filters.beneficiario) {
        queryBuilder = queryBuilder.ilike("beneficiario", `%${filters.beneficiario}%`);
      }
    }

    const response = await SupabaseWrapper.selectPaginated<GastosType>(queryBuilder, {
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
      queryDescription: `getGastos page=${page} limit=${limit}`,
    });

    if (response.error) {
      return response;
    }

    // Procesar los datos para asegurar que las comprobante_url sean URLs completas
    const processedData = (response.data || []).map(item => ({
      ...item,
      comprobante_url: item.comprobante_url ? this.getComprobanteUrl(item.comprobante_url) : null,
    }));

    return {
      data: processedData,
      count: response.count,
      error: null,
    };
  }

  // Obtener gasto por ID
  async getGastoById(id: string): Promise<ApiResponse<GastosType>> {
    const response = await SupabaseWrapper.select<GastosType>(
      SupabaseWrapper.from(this.tableName).select("*").eq("id", id).single(),
      {
        tableName: this.tableName,
        operation: "SELECT",
        logLevel: "none",
        queryDescription: `getGastoById id=${id}`,
      }
    );

    if (response.error || !response.data) {
      return response;
    }

    // Procesar el dato para asegurar que la comprobante_url sea una URL completa
    const processedData = {
      ...response.data,
      comprobante_url: response.data.comprobante_url
        ? this.getComprobanteUrl(response.data.comprobante_url)
        : null,
    };

    return { data: processedData, error: null };
  }

  // Crear gasto
  async createGasto(data: GastosFormDataType): Promise<ApiResponse<GastosType>> {
    try {
      // Preparar datos para inserción (solo incluir campos que existen)
      // Si hay un archivo adjunto, intentar subirlo
      let comprobante_url = null;
      let uploadWarning = null;

      if (data.comprobante) {
        try {
          const fileName = `${Date.now()}_${data.comprobante.name}`;

          // Estrategia 1: Subida normal con upsert
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("comprobantes")
            .upload(fileName, data.comprobante, {
              upsert: true,
              contentType: data.comprobante.type,
            });

          if (!uploadError && uploadData) {
            const { data: publicUrl } = supabase.storage
              .from("comprobantes")
              .getPublicUrl(uploadData.path);
            comprobante_url = publicUrl.publicUrl;
          } else {
            console.warn("Estrategia 1 falló:", uploadError);

            // Estrategia 2: Intentar sin especificar contentType
            const { data: uploadData2, error: uploadError2 } = await supabase.storage
              .from("comprobantes")
              .upload(fileName, data.comprobante, { upsert: true });

            if (!uploadError2 && uploadData2) {
              const { data: publicUrl2 } = supabase.storage
                .from("comprobantes")
                .getPublicUrl(uploadData2.path);
              comprobante_url = publicUrl2.publicUrl;
            } else {
              console.warn("Estrategia 2 falló:", uploadError2);

              // Estrategia 3: Usar update en lugar de upload (para archivos existentes)
              const { data: uploadData3, error: uploadError3 } = await supabase.storage
                .from("comprobantes")
                .update(fileName, data.comprobante, {
                  contentType: data.comprobante.type,
                });

              if (!uploadError3 && uploadData3) {
                const { data: publicUrl3 } = supabase.storage
                  .from("comprobantes")
                  .getPublicUrl(uploadData3.path);
                comprobante_url = publicUrl3.publicUrl;
              } else {
                console.warn("Estrategia 3 falló:", uploadError3);
                uploadWarning =
                  "No se pudo subir el comprobante. El gasto se guardará sin comprobante.";
              }
            }
          }
        } catch (err) {
          console.error("Error inesperado en subida:", err);
          uploadWarning = "Error al procesar el comprobante. El gasto se guardará sin comprobante.";
        }
      }

      const gastoData: Omit<Gastos, "id"> = {
        fecha_gasto: data.fecha_gasto,
        descripcion: data.descripcion,
        categoria: data.categoria,
        monto: data.monto,
        moneda: data.moneda,
        beneficiario: data.beneficiario,
        referencia: data.referencia,
        metodo_pago: data.metodo_pago,
        notas: data.notas,
        fecha_creacion: new Date().toISOString(),
        estado: "pendiente" as EstadoGasto,
        usuario_id: (await supabase.auth.getUser()).data.user?.id,
      };

      // Solo agregar comprobante_url si se subió exitosamente
      if (comprobante_url) {
        gastoData.comprobante_url = comprobante_url;
      }

      const { data: result, error } = await supabase
        .from("gastos")
        .insert(gastoData)
        .select()
        .single();

      if (error) {
        console.error("Error creating gasto:", error);
        return { data: null, error: error.message };
      }

      // Retornar éxito con warning si hubo problemas con el comprobante
      return {
        data: result,
        error: null,
        warning: uploadWarning,
      };
    } catch (err) {
      console.error("Error in createGasto:", err);
      return { data: null, error: "Error al crear gasto" };
    }
  }

  // Actualizar gasto
  async updateGasto(id: string, data: Partial<GastosFormData>): Promise<ApiResponse<GastosType>> {
    try {
      // Si hay un archivo adjunto, intentar subirlo
      let comprobante_url = null;
      let uploadWarning = null;

      if (data.comprobante) {
        try {
          const fileName = `${Date.now()}_${data.comprobante.name}`;

          // Estrategia 1: Subida normal con upsert
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("comprobantes")
            .upload(fileName, data.comprobante, {
              upsert: true,
              contentType: data.comprobante.type,
            });

          if (!uploadError && uploadData) {
            const { data: publicUrl } = supabase.storage
              .from("comprobantes")
              .getPublicUrl(uploadData.path);
            comprobante_url = publicUrl.publicUrl;
          } else {
            console.warn("Estrategia 1 falló:", uploadError);

            // Estrategia 2: Intentar sin especificar contentType
            const { data: uploadData2, error: uploadError2 } = await supabase.storage
              .from("comprobantes")
              .upload(fileName, data.comprobante, { upsert: true });

            if (!uploadError2 && uploadData2) {
              const { data: publicUrl2 } = supabase.storage
                .from("comprobantes")
                .getPublicUrl(uploadData2.path);
              comprobante_url = publicUrl2.publicUrl;
            } else {
              console.warn("Estrategia 2 falló:", uploadError2);

              // Estrategia 3: Usar update en lugar de upload (para archivos existentes)
              const { data: uploadData3, error: uploadError3 } = await supabase.storage
                .from("comprobantes")
                .update(fileName, data.comprobante, {
                  contentType: data.comprobante.type,
                });

              if (!uploadError3 && uploadData3) {
                const { data: publicUrl3 } = supabase.storage
                  .from("comprobantes")
                  .getPublicUrl(uploadData3.path);
                comprobante_url = publicUrl3.publicUrl;
              } else {
                console.warn("Estrategia 3 falló:", uploadError3);
                uploadWarning =
                  "No se pudo subir el comprobante. El gasto se actualizará sin comprobante.";
              }
            }
          }
        } catch (err) {
          console.error("Error inesperado en subida:", err);
          uploadWarning =
            "Error al procesar el comprobante. El gasto se actualizará sin comprobante.";
        }
      }

      // Preparar datos para actualizar
      const updateData: Partial<Gastos> = { ...data };
      delete updateData.comprobante; // Remover el archivo del objeto de datos

      // Solo agregar comprobante_url si se subió exitosamente
      if (comprobante_url) {
        updateData.comprobante_url = comprobante_url;
      }

      // Agregar fecha de actualización
      updateData.updated_at = new Date().toISOString();

      const { data: result, error } = await supabase
        .from("gastos")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating gasto:", error);
        return { data: null, error: error.message };
      }

      // Retornar éxito con warning si hubo problemas con el comprobante
      return {
        data: result,
        error: uploadWarning || null,
      };
    } catch (err) {
      console.error("Error in updateGasto:", err);
      return { data: null, error: "Error al actualizar gasto" };
    }
  }

  // Eliminar gasto
  async deleteGasto(id: string): Promise<ApiResponse<null>> {
    return SupabaseWrapper.delete(SupabaseWrapper.from(this.tableName).delete().eq("id", id), {
      tableName: this.tableName,
      operation: "DELETE",
      logLevel: "critical",
      queryDescription: `deleteGasto id=${id}`,
    });
  }

  // Aprobar gasto (cambiar estado a aprobado)
  async aprobarGasto(id: string): Promise<ApiResponse<GastosType>> {
    return this.updateGasto(id, { estado: "aprobado" });
  }

  // Rechazar gasto
  async rechazarGasto(id: string): Promise<ApiResponse<GastosType>> {
    return this.updateGasto(id, { estado: "rechazado" });
  }

  // Marcar como pagado
  async marcarPagado(id: string): Promise<ApiResponse<GastosType>> {
    return this.updateGasto(id, { estado: "pagado" });
  }

  // Obtener estadísticas de gastos
  async getEstadisticas(
    fechaDesde?: string,
    fechaHasta?: string
  ): Promise<ApiResponse<GastosStatsType>> {
    try {
      let baseFilters = supabase.from("gastos");
      if (fechaDesde) {
        baseFilters = baseFilters.gte("fecha_gasto", fechaDesde);
      }
      if (fechaHasta) {
        baseFilters = baseFilters.lte("fecha_gasto", fechaHasta);
      }

      // Total acumulado
      const totalPromise = baseFilters.select("sum:monto").single();

      // Totales por categoría y estado en una sola pasada agregada
      const groupedPromise = baseFilters.select("categoria, estado, sum:monto, count:estado");

      const [totalResult, groupedResult] = await Promise.all([totalPromise, groupedPromise]);

      if (totalResult.error) {
        console.error("Error fetching total estadísticas:", totalResult.error);
        return { data: null, error: totalResult.error.message };
      }

      if (groupedResult.error) {
        console.error("Error fetching grouped estadísticas:", groupedResult.error);
        return { data: null, error: groupedResult.error.message };
      }

      const stats: GastosStatsType = {
        total_mes: (totalResult.data as any)?.sum || 0,
        total_categoria: {
          operativos: 0,
          administrativos: 0,
          mantenimiento: 0,
          transporte: 0,
          suministros: 0,
          servicios_publicos: 0,
          marketing: 0,
          salarios: 0,
          impuestos: 0,
          otros: 0,
        },
        gastos_pendientes: 0,
        gastos_aprobados: 0,
      };

      (groupedResult.data || []).forEach(row => {
        const categoria = (row as any).categoria as CategoriaGasto;
        const estado = (row as any).estado as EstadoGasto;
        const subtotal = (row as any).sum || 0;
        const totalFilas = Number((row as any).count || 0);

        if (categoria && categoria in stats.total_categoria) {
          stats.total_categoria[categoria] += subtotal;
        }

        if (estado === "pendiente") stats.gastos_pendientes += totalFilas;
        if (estado === "aprobado") stats.gastos_aprobados += totalFilas;
      });

      return { data: stats, error: null };
    } catch (err) {
      console.error("Error in getEstadisticas:", err);
      return { data: null, error: "Error al obtener estadísticas" };
    }
  }

  // Obtener gastos por categoría
  async getGastosPorCategoria(
    categoria: CategoriaGasto,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<GastosType>> {
    return this.getGastos(page, limit, { categoria });
  }

  // Obtener gastos pendientes de aprobación
  async getGastosPendientes(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<GastosType>> {
    return this.getGastos(page, limit, { estado: "pendiente" });
  }
}

export const gastosService = new GastosService();
