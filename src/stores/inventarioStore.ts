import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { Producto } from "@/services";

interface InventarioState {
  productos: Producto[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  // Acciones
  setProductos: (productos: Producto[]) => void;
  addProducto: (producto: Producto) => void;
  updateProducto: (id: string, updates: Partial<Producto>) => void;
  removeProducto: (id: string) => void;
  getProductoById: (id: string) => Producto | undefined;
  // Suscripción en tiempo real
  subscribe: () => () => void; // Retorna función de limpieza
  unsubscribe: () => void;
}

let subscription: { unsubscribe: () => void } | null = null;

export const useInventarioStore = create<InventarioState>((set, get) => {
  const subscribe = () => {
    // Si ya hay una suscripción activa, no crear otra
    if (subscription) {
      return () => {};
    }

    // Suscribirse a cambios en la tabla inventario
    subscription = supabase
      .channel("inventario-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventario",
        },
        payload => {
          const { productos } = get();

          if (payload.eventType === "INSERT") {
            // Nuevo producto agregado
            const newProduct = payload.new as Producto;
            // Verificar que no exista ya (evitar duplicados)
            if (!productos.find(p => p.id === newProduct.id)) {
              set({
                productos: [...productos, newProduct],
                lastUpdate: new Date(),
              });
            }
          } else if (payload.eventType === "UPDATE") {
            // Producto actualizado
            const updatedProduct = payload.new as Producto;
            set({
              productos: productos.map(p => (p.id === updatedProduct.id ? updatedProduct : p)),
              lastUpdate: new Date(),
            });
          } else if (payload.eventType === "DELETE") {
            // Producto eliminado
            const deletedId = (payload.old as { id: string }).id;
            set({
              productos: productos.filter(p => p.id !== deletedId),
              lastUpdate: new Date(),
            });
          }
        }
      )
      .subscribe();

    // Retornar función de limpieza
    return () => {
      if (subscription) {
        subscription.unsubscribe();
        subscription = null;
      }
    };
  };

  const unsubscribe = () => {
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }
  };

  return {
    productos: [],
    loading: false,
    error: null,
    lastUpdate: null,
    setProductos: productos => set({ productos, lastUpdate: new Date() }),
    addProducto: producto =>
      set(state => ({
        productos: [...state.productos, producto],
        lastUpdate: new Date(),
      })),
    updateProducto: (id, updates) =>
      set(state => ({
        productos: state.productos.map(p => (p.id === id ? { ...p, ...updates } : p)),
        lastUpdate: new Date(),
      })),
    removeProducto: id =>
      set(state => ({
        productos: state.productos.filter(p => p.id !== id),
        lastUpdate: new Date(),
      })),
    getProductoById: id => {
      const { productos } = get();
      return productos.find(p => p.id === id);
    },
    subscribe,
    unsubscribe,
  };
});
