import { useAuthStore } from "@/stores/authStore";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Usuario } from "@/services";

/**
 * Hook personalizado que reemplaza useAuth del context
 * Ahora usa Zustand store para mantener consistencia y añade inicialización automática
 */
export function useAuth() {
  const {
    user,
    loading,
    initialized,
    signIn,
    signUp,
    signOut,
    resetPassword,
    setUser,
    setLoading,
  } = useAuthStore();

  // Inicializar autenticación solo una vez
  useEffect(() => {
    if (initialized) return;

    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          if (mounted) {
            setLoading(false);
            useAuthStore.setState({ initialized: true });
          }
          return;
        }

        if (session?.user && mounted) {
          const usuario: Usuario = {
            id: session.user.id,
            email: session.user.email || "",
            nombre:
              session.user.user_metadata?.nombre || session.user.email?.split("@")[0] || "Usuario",
            telefono: session.user.user_metadata?.telefono,
            avatar_url: session.user.user_metadata?.avatar_url,
            role: "vendedor",
          };
          setUser(usuario);
        }

        if (mounted) {
          setLoading(false);
          useAuthStore.setState({ initialized: true });
        }
      } catch (error) {
        console.error("Error during auth initialization:", error);
        if (mounted) {
          setLoading(false);
          useAuthStore.setState({ initialized: true });
        }
      }
    };

    // Listener de cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, _session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        setUser(null);
      } else if (event === "SIGNED_IN" && _session?.user) {
        const usuario: Usuario = {
          id: _session.user.id,
          email: _session.user.email || "",
          nombre:
            _session.user.user_metadata?.nombre || _session.user.email?.split("@")[0] || "Usuario",
          telefono: _session.user.user_metadata?.telefono,
          avatar_url: _session.user.user_metadata?.avatar_url,
          role: "vendedor",
        };
        setUser(usuario);
      }
    });

    // Timeout de seguridad
    const timeoutId = setTimeout(() => {
      if (mounted) {
        setLoading(false);
        useAuthStore.setState({ initialized: true });
      }
    }, 3000);

    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [initialized, setUser, setLoading]);

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}
