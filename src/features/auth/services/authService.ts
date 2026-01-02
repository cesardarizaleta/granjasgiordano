import { supabase } from "@/integrations/supabase/client";
import type { Usuario, ApiResponse } from "./types";
import type { User } from "@supabase/supabase-js";

class AuthService {
  // Iniciar sesión
  async signIn(email: string, password: string): Promise<ApiResponse<Usuario>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      // Crear usuario desde la información de auth
      if (data.user) {
        const usuario = this.createUserFromAuth(data.user);
        return { data: usuario, error: null };
      }

      return { data: null, error: "Error al obtener información del usuario" };
    } catch {
      return { data: null, error: "Error inesperado en el inicio de sesión" };
    }
  }

  // Registrarse
  async signUp(email: string, password: string, nombre: string): Promise<ApiResponse<Usuario>> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nombre },
        },
      });

      if (error) {
        return { data: null, error: error.message };
      }

      // Crear usuario desde la información de auth
      if (data.user) {
        const usuario = this.createUserFromAuth(data.user);
        return { data: usuario, error: null };
      }

      return { data: null, error: "Usuario creado pero información no disponible" };
    } catch {
      return { data: null, error: "Error inesperado en el registro" };
    }
  }

  // Cerrar sesión
  async signOut(): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { data: null, error: error.message };
      }
      return { data: null, error: null };
    } catch {
      return { data: null, error: "Error inesperado al cerrar sesión" };
    }
  }

  // Obtener usuario actual
  async getCurrentUser(): Promise<ApiResponse<Usuario>> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: "No hay usuario autenticado" };
      }

      const usuario = this.createUserFromAuth(user);
      return { data: usuario, error: null };
    } catch {
      return { data: null, error: "Error al obtener usuario actual" };
    }
  }

  // Obtener perfil (ahora usa solo auth)
  async getProfile(_userId: string): Promise<ApiResponse<Usuario>> {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        return { data: null, error: "Usuario no encontrado" };
      }

      const usuario = this.createUserFromAuth(user);
      return { data: usuario, error: null };
    } catch {
      return { data: null, error: "Error al obtener perfil" };
    }
  }

  // Método auxiliar para crear usuario desde auth
  private createUserFromAuth(user: User): Usuario {
    return {
      id: user.id,
      email: user.email || "",
      nombre: user.user_metadata?.nombre || user.email?.split("@")[0] || "Usuario",
      telefono: user.user_metadata?.telefono,
      avatar_url: user.user_metadata?.avatar_url,
      role: "vendedor", // Rol por defecto
    };
  }

  // Reset password
  async resetPassword(email: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: null, error: null };
    } catch {
      return { data: null, error: "Error al enviar email de recuperación" };
    }
  }
}

export const authService = new AuthService();
