import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export function AuthGuard({ children, requireAuth = true, redirectTo = "/login" }: AuthGuardProps) {
  const location = useLocation();
  const { user, loading } = useAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando autenticación...</p>
          <p className="text-xs text-muted-foreground mt-2">
            Esto debería tomar solo unos segundos
          </p>
        </div>
      </div>
    );
  }

  // Si requiere autenticación y no hay usuario, redirigir al login
  if (requireAuth && !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Si no requiere autenticación pero hay usuario, redirigir al dashboard
  if (!requireAuth && user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
