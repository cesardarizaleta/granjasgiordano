import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Algo salió mal</AlertTitle>
              <AlertDescription className="mt-2">
                Ha ocurrido un error inesperado en la aplicación.
                {process.env.NODE_ENV === "development" && this.state.error && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">
                      Detalles técnicos
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => window.location.reload()} className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Recargar página
              </Button>
              <Button
                variant="outline"
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="flex-1"
              >
                Intentar nuevamente
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
