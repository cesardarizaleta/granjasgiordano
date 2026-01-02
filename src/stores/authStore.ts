import { create } from "zustand";
import { authService } from "@/services";
import type { Usuario } from "@/services";

interface AuthState {
  user: Usuario | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, nombre: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  initialize: () => Promise<void>;
  setUser: (user: Usuario | null) => void;
  setLoading: (loading: boolean) => void;
}

// Store unificado para autenticación (reemplaza AuthContext)
export const useAuthStore = create<AuthState>((set, _get) => ({
  user: null,
  loading: true,
  initialized: false,

  setUser: user => set({ user }),

  setLoading: loading => set({ loading }),

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true });
      const result = await authService.signIn(email, password);

      if (result.error) {
        set({ loading: false });
        return { error: result.error };
      }

      if (result.data) {
        set({ user: result.data, loading: false });
      }

      return { error: null };
    } catch (error) {
      console.error("Sign in error:", error);
      set({ loading: false });
      return { error: "Error inesperado al iniciar sesión" };
    }
  },

  signUp: async (email: string, password: string, nombre: string) => {
    try {
      const result = await authService.signUp(email, password, nombre);
      return { error: result.error };
    } catch (error) {
      console.error("Sign up error:", error);
      return { error: "Error inesperado al registrarse" };
    }
  },

  signOut: async () => {
    try {
      await authService.signOut();
      set({ user: null });
    } catch (error) {
      console.error("Sign out error:", error);
    }
  },

  resetPassword: async (email: string) => {
    try {
      const result = await authService.resetPassword(email);
      return { error: result.error };
    } catch (error) {
      console.error("Reset password error:", error);
      return { error: "Error al enviar email de recuperación" };
    }
  },

  initialize: async () => {
    try {
      const result = await authService.getCurrentUser();
      if (result.data) {
        set({ user: result.data, loading: false, initialized: true });
      } else {
        set({ user: null, loading: false, initialized: true });
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
      set({ user: null, loading: false, initialized: true });
    }
  },
}));
