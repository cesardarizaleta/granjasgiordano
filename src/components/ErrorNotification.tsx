import React from "react";
import { AlertCircle, XCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ErrorType, getUserFriendlyMessage } from "@/lib/errors";

interface ErrorNotificationProps {
  type: ErrorType;
  title?: string;
  message?: string;
  onClose?: () => void;
  showDetails?: boolean;
  technicalDetails?: string;
}

export function ErrorNotification({
  type,
  title,
  message,
  onClose,
  showDetails = false,
  technicalDetails,
}: ErrorNotificationProps) {
  const getIcon = () => {
    switch (type) {
      case ErrorType.NETWORK:
        return <XCircle className="h-4 w-4" />;
      case ErrorType.VALIDATION:
        return <AlertCircle className="h-4 w-4" />;
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return <XCircle className="h-4 w-4" />;
      case ErrorType.NOT_FOUND:
        return <Info className="h-4 w-4" />;
      case ErrorType.SERVER:
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getVariant = () => {
    switch (type) {
      case ErrorType.NETWORK:
      case ErrorType.SERVER:
      case ErrorType.AUTHENTICATION:
      case ErrorType.AUTHORIZATION:
        return "destructive";
      case ErrorType.NOT_FOUND:
        return "default";
      case ErrorType.VALIDATION:
        return "destructive";
      default:
        return "destructive";
    }
  };

  const defaultTitle = () => {
    switch (type) {
      case ErrorType.NETWORK:
        return "Error de conexión";
      case ErrorType.VALIDATION:
        return "Datos inválidos";
      case ErrorType.AUTHENTICATION:
        return "Error de autenticación";
      case ErrorType.AUTHORIZATION:
        return "Sin permisos";
      case ErrorType.NOT_FOUND:
        return "No encontrado";
      case ErrorType.SERVER:
        return "Error del servidor";
      default:
        return "Error";
    }
  };

  const userFriendlyMessage = message || getUserFriendlyMessage(type);

  return (
    <Alert variant={getVariant()} className="relative">
      {getIcon()}
      <div className="flex-1">
        <AlertDescription className="font-medium">{title || defaultTitle()}</AlertDescription>
        <AlertDescription className="mt-1">{userFriendlyMessage}</AlertDescription>

        {showDetails && technicalDetails && (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium">Detalles técnicos</summary>
            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
              {technicalDetails}
            </pre>
          </details>
        )}
      </div>

      {onClose && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-2 right-2 h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </Alert>
  );
}

/**
 * Hook para mostrar notificaciones de error
 */
export function useErrorNotification() {
  const [notifications, setNotifications] = React.useState<
    Array<{
      id: string;
      type: ErrorType;
      title?: string;
      message?: string;
      technicalDetails?: string;
    }>
  >([]);

  const showError = (
    type: ErrorType,
    title?: string,
    message?: string,
    technicalDetails?: string
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, title, message, technicalDetails }]);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
      removeError(id);
    }, 5000);

    return id;
  };

  const removeError = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    showError,
    removeError,
    clearAll,
  };
}
