import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ventaService, clienteService, inventarioService, cobranzaService } from "@/services";
import { APP_CONFIG } from "@/constants";
import type { Venta, Producto, VentaItem } from "@/services";

// Query Keys
export const queryKeys = {
  ventas: ["ventas"] as const,
  venta: (id: string) => ["ventas", id] as const,
  ventasRecent: ["ventas", "recent"] as const,
  ventasChart: ["ventas", "chart"] as const,

  clientes: ["clientes"] as const,
  cliente: (id: string) => ["clientes", id] as const,

  productos: ["productos"] as const,
  producto: (id: string) => ["productos", id] as const,
  inventarioStatus: ["productos", "status"] as const,

  cobranzas: ["cobranzas"] as const,
  cobranza: (id: string) => ["cobranzas", id] as const,
  cobranzasChart: ["cobranzas", "chart"] as const,
};

// Ventas Queries
export const useVentas = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: [...queryKeys.ventas, page, limit],
    queryFn: () => ventaService.getVentas(page, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes - datos cambian frecuentemente
  });
};

export const useVentasRecent = (limit: number = 5) => {
  return useQuery({
    queryKey: queryKeys.ventasRecent,
    queryFn: () => ventaService.getVentas(1, limit),
    staleTime: 30 * 1000, // 30 seconds - datos recientes cambian rápido
  });
};

export const useVentasChart = () => {
  return useQuery({
    queryKey: queryKeys.ventasChart,
    queryFn: async () => {
      const [ventasRes, cobranzasRes] = await Promise.all([
        ventaService.getVentas(1, 1000),
        cobranzaService.getCobranzas(1, 1000),
      ]);
      return { ventas: ventasRes, cobranzas: cobranzasRes };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - datos históricos cambian poco
  });
};

// Clientes Queries
export const useClientes = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: [...queryKeys.clientes, page, limit],
    queryFn: () => clienteService.getClientes(page, limit),
    staleTime: 10 * 60 * 1000, // 10 minutes - datos de clientes cambian poco
  });
};

export const useClientesMap = () => {
  return useQuery({
    queryKey: [...queryKeys.clientes, "map"],
    queryFn: async () => {
      const response = await clienteService.getClientes(1, 1000);
      if (response.error || !response.data) return new Map<string, string>();

      const map = new Map<string, string>();
      response.data.forEach(cliente => {
        map.set(cliente.id, cliente.nombre);
      });
      return map;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Productos/Inventario Queries
export const useProductos = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: [...queryKeys.productos, page, limit],
    queryFn: () => inventarioService.getProductos(page, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes - stock cambia frecuentemente
  });
};

export const useInventarioStatus = () => {
  return useQuery({
    queryKey: queryKeys.inventarioStatus,
    queryFn: () => inventarioService.getProductos(1, 1000),
    staleTime: 1 * 60 * 1000, // 1 minute - status de inventario cambia relativamente rápido
  });
};

// Cobranzas Queries
export const useCobranzas = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: [...queryKeys.cobranzas, page, limit],
    queryFn: () => cobranzaService.getCobranzas(page, limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Mutations
export const useCreateVenta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ventaData,
      items,
    }: {
      ventaData: Omit<Venta, "id">;
      items: Omit<VentaItem, "id" | "venta_id">[];
    }) => ventaService.createVenta(ventaData, items),
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: queryKeys.ventas });
      queryClient.invalidateQueries({ queryKey: queryKeys.ventasRecent });
      queryClient.invalidateQueries({ queryKey: queryKeys.ventasChart });
      queryClient.invalidateQueries({ queryKey: queryKeys.productos }); // Stock cambió
    },
  });
};

export const useUpdateProducto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Producto> }) =>
      inventarioService.updateProducto(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.productos });
      queryClient.invalidateQueries({ queryKey: queryKeys.inventarioStatus });
    },
  });
};

// Dashboard hook optimizado - combina múltiples queries para evitar waterfalls
export const useDashboardData = () => {
  // Paralelizar las llamadas principales del dashboard
  const ventasQuery = useVentasRecent(APP_CONFIG.DASHBOARD.RECENT_SALES_LIMIT);
  const chartQuery = useVentasChart();
  const inventoryQuery = useInventarioStatus();

  // Calcular estadísticas generales usando useMemo para evitar recálculos
  const stats = useMemo(() => {
    if (!ventasQuery.data?.data || !chartQuery.data?.ventas.data || !inventoryQuery.data?.data) {
      return {
        ventasMes: 0,
        inventarioTotal: 0,
        pedidosPendientes: 0,
      };
    }

    // Calcular ventas del mes actual
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const ventasMes = chartQuery.data.ventas.data
      .filter(venta => {
        const ventaDate = new Date(venta.fecha_venta);
        return ventaDate.getMonth() === currentMonth && ventaDate.getFullYear() === currentYear;
      })
      .reduce((total, venta) => total + venta.total, 0);

    // Calcular inventario total
    const inventarioTotal = inventoryQuery.data.data.reduce((total, producto) => {
      return total + producto.stock * (producto.peso || 0);
    }, 0);

    // Calcular pedidos pendientes (ventas con estado 'pendiente')
    const pedidosPendientes = ventasQuery.data.data.filter(
      venta => venta.estado === "pendiente" || venta.estado === "procesando"
    ).length;

    return {
      ventasMes,
      inventarioTotal,
      pedidosPendientes,
    };
  }, [ventasQuery.data?.data, chartQuery.data?.ventas.data, inventoryQuery.data?.data]);

  return {
    // Estados de carga
    isLoading: ventasQuery.isLoading || chartQuery.isLoading || inventoryQuery.isLoading,
    isError: ventasQuery.isError || chartQuery.isError || inventoryQuery.isError,

    // Datos
    recentSales: ventasQuery.data?.data || [],
    chartData: chartQuery.data,
    inventoryData: inventoryQuery.data?.data || [],

    // Estadísticas calculadas
    stats,

    // Funciones de refetch
    refetchAll: () => {
      ventasQuery.refetch();
      chartQuery.refetch();
      inventoryQuery.refetch();
    },
  };
};
