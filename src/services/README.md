# Servicios Estandarizados

Este directorio contiene servicios estandardizados con wrappers genéricos para reducir código repetitivo.

## SupabaseWrapper

Wrapper genérico que maneja automáticamente:

- ✅ Manejo de errores consistente
- ✅ Logging de operaciones
- ✅ Medición de tiempo de ejecución
- ✅ Transformación de respuestas

### Uso Básico

```typescript
import { SupabaseWrapper } from "@/services/supabaseWrapper";

// SELECT simple
const response = await SupabaseWrapper.select<Producto>(
  SupabaseWrapper.from("inventario").select("*").eq("id", productId).single(),
  {
    tableName: "inventario",
    operation: "SELECT",
    logQuery: true,
    queryDescription: "getProductoById",
  }
);

// SELECT con paginación
const response = await SupabaseWrapper.selectPaginated<Cliente>(SupabaseWrapper.from("clientes"), {
  tableName: "clientes",
  operation: "SELECT",
  pagination: {
    page: 1,
    limit: 10,
    orderBy: "fecha_creacion",
    orderDirection: "desc",
  },
  logQuery: true,
});

// INSERT
const response = await SupabaseWrapper.insert<Producto>(
  SupabaseWrapper.from("inventario").insert([productData]).select().single(),
  {
    tableName: "inventario",
    operation: "INSERT",
    logQuery: true,
  }
);

// UPDATE
const response = await SupabaseWrapper.update<Producto>(
  SupabaseWrapper.from("inventario").update(updates).eq("id", id).select().single(),
  {
    tableName: "inventario",
    operation: "UPDATE",
    logQuery: true,
  }
);

// DELETE
const response = await SupabaseWrapper.delete(
  SupabaseWrapper.from("inventario").delete().eq("id", id),
  {
    tableName: "inventario",
    operation: "DELETE",
    logQuery: true,
  }
);
```

### Opciones Disponibles

```typescript
interface DbOperationOptions {
  tableName: string; // Nombre de la tabla (requerido)
  operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE"; // Tipo de operación
  logQuery?: boolean; // Si loguear la query (default: false)
  logError?: boolean; // Si loguear errores (default: true)
  measureTime?: boolean; // Si medir tiempo de ejecución (default: true)
  queryDescription?: string; // Descripción para el log
}
```

## Hook useApi

Hook genérico para manejar llamadas a API con:

- ✅ Estado de loading automático
- ✅ Manejo de errores
- ✅ Caching opcional
- ✅ Refetch automático
- ✅ Callbacks de éxito/error

### Uso Básico

```typescript
import { useApi } from "@/hooks/useApi";
import { inventarioService } from "@/services";

function ProductosList() {
  const { data, loading, error, execute } = useApi({
    apiFunction: () => inventarioService.getProductos(1, 10),
    immediate: true, // Ejecutar al montar
    cacheTime: 60000, // Cache de 1 minuto
  });

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return null;

  return (
    <div>
      {data.map(producto => (
        <div key={producto.id}>{producto.nombre_producto}</div>
      ))}
      <button onClick={execute}>Refrescar</button>
    </div>
  );
}
```

### Opciones Avanzadas

```typescript
const { data, loading, error, execute, reset } = useApi({
  apiFunction: () => inventarioService.getProductos(1, 10),
  immediate: true,
  cacheTime: 60000, // Cache de 1 minuto
  refetchOnWindowFocus: true, // Refetch cuando la ventana recupera foco
  refetchInterval: 30000, // Refetch cada 30 segundos
  onSuccess: data => {
    console.log("Datos cargados:", data);
  },
  onError: error => {
    toast.error(`Error: ${error}`);
  },
});
```

### Para Respuestas Paginadas

```typescript
import { usePaginatedApi } from "@/hooks/useApi";

const { data, loading, error, execute } = usePaginatedApi({
  apiFunction: () => clienteService.getClientes(1, 10),
  immediate: true,
});
```

## Migración de Servicios Existentes

### Antes (Código Repetitivo)

```typescript
async getProductos(page: number = 1, limit: number = 10) {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("inventario")
      .select("*", { count: "exact" })
      .range(from, to)
      .order("fecha_creacion", { ascending: false });

    if (error) {
      await loggingService.logError("inventario", "SELECT", error.message);
      return { data: [], count: 0, error: error.message };
    }

    await loggingService.logSelect("inventario", "getProductos", data?.map(p => p.id));
    return { data: data || [], count: count || 0, error: null };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Error al obtener productos";
    await loggingService.logError("inventario", "SELECT", errorMessage);
    return { data: [], count: 0, error: errorMessage };
  }
}
```

### Después (Con Wrapper)

```typescript
async getProductos(page: number = 1, limit: number = 10) {
  return SupabaseWrapper.selectPaginated<Producto>(
    SupabaseWrapper.from("inventario"),
    {
      tableName: "inventario",
      operation: "SELECT",
      pagination: {
        page,
        limit,
        orderBy: "fecha_creacion",
        orderDirection: "desc",
      },
      logQuery: true,
      queryDescription: `getProductos page=${page} limit=${limit}`,
    }
  );
}
```

## Beneficios

1. **Menos código**: Reducción de ~70% en código repetitivo
2. **Consistencia**: Todas las operaciones manejan errores de la misma forma
3. **Mantenibilidad**: Cambios en logging/errores se hacen en un solo lugar
4. **Type safety**: TypeScript garantiza tipos correctos
5. **Testing**: Más fácil de testear con mocks

## Ejemplo Completo

Ver `src/features/clientes/services/clienteService.refactored.ts` para un ejemplo completo de un servicio refactorizado.
