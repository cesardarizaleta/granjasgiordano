import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useDolarStore } from "@/stores/dolarStore";
import { useInventarioStore } from "@/stores/inventarioStore";

/**
 * Componente que inicializa los stores de Zustand
 * Se monta una vez al inicio de la aplicación
 */
export function StoreInitializer() {
  const initializeAuth = useAuthStore(state => state.initialize);
  const startAutoRefresh = useDolarStore(state => state.startAutoRefresh);
  const subscribeInventario = useInventarioStore(state => state.subscribe);
  const unsubscribeInventario = useInventarioStore(state => state.unsubscribe);

  useEffect(() => {
    // Inicializar autenticación
    initializeAuth();

    // Inicializar auto-refresh de dólar
    const cleanupDolar = startAutoRefresh();

    // Suscribirse a cambios de autenticación para activar/desactivar inventario
    const unsubscribeAuth = useAuthStore.subscribe(
      state => state.user,
      user => {
        if (user) {
          // Usuario autenticado, suscribirse a inventario
          subscribeInventario();
        } else {
          // Usuario desautenticado, desuscribirse
          unsubscribeInventario();
        }
      }
    );

    // Verificar si ya hay un usuario autenticado al montar
    const checkInitialAuth = () => {
      const { user } = useAuthStore.getState();
      if (user) {
        subscribeInventario();
      }
    };

    // Esperar un poco para que la autenticación se inicialice
    const timeoutId = setTimeout(checkInitialAuth, 1000);

    return () => {
      clearTimeout(timeoutId);
      unsubscribeAuth();
      cleanupDolar();
      unsubscribeInventario();
    };
  }, [initializeAuth, startAutoRefresh, subscribeInventario, unsubscribeInventario]);

  return null; // Este componente no renderiza nada
}
