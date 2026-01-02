import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, ExternalLink, FileText, Image as ImageIcon, X } from "lucide-react";

interface ComprobanteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comprobanteUrl: string | null;
  fileName?: string;
}

export const ComprobanteModal: React.FC<ComprobanteModalProps> = ({
  open,
  onOpenChange,
  comprobanteUrl,
  fileName,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"image" | "pdf" | "unknown">("unknown");

  useEffect(() => {
    if (comprobanteUrl && open) {
      setLoading(true);
      setError(null);

      // Determinar el tipo de archivo basado en la extensión
      const extension = comprobanteUrl.split(".").pop()?.toLowerCase();
      if (extension === "pdf") {
        setFileType("pdf");
      } else if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
        setFileType("image");
      } else {
        setFileType("unknown");
      }

      // Simular carga
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [comprobanteUrl, open]);

  const handleDownload = () => {
    if (comprobanteUrl) {
      const link = document.createElement("a");
      link.href = comprobanteUrl;
      link.download = fileName || "comprobante";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenExternal = () => {
    if (comprobanteUrl) {
      window.open(comprobanteUrl, "_blank");
    }
  };

  const getFileIcon = () => {
    switch (fileType) {
      case "image":
        return <ImageIcon className="w-8 h-8 text-blue-500" />;
      case "pdf":
        return <FileText className="w-8 h-8 text-red-500" />;
      default:
        return <FileText className="w-8 h-8 text-gray-500" />;
    }
  };

  const getFileTypeLabel = () => {
    switch (fileType) {
      case "image":
        return "Imagen";
      case "pdf":
        return "Documento PDF";
      default:
        return "Archivo";
    }
  };

  if (!comprobanteUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            {getFileIcon()}
            <div>
              <DialogTitle className="text-lg">{fileName || "Comprobante"}</DialogTitle>
              <Badge variant="outline" className="mt-1">
                {getFileTypeLabel()}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" />
              Descargar
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenExternal} className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Abrir
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-[400px] bg-gray-50 rounded-lg border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Cargando comprobante...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <X className="w-8 h-8 mx-auto mb-4 text-red-500" />
                <p className="text-sm text-red-600 mb-2">Error al cargar el comprobante</p>
                <p className="text-xs text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" onClick={handleOpenExternal} className="mt-4">
                  Intentar abrir externamente
                </Button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center p-4">
              {fileType === "image" ? (
                <img
                  src={comprobanteUrl}
                  alt="Comprobante"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  onError={() => setError("No se pudo cargar la imagen")}
                  onLoad={() => setLoading(false)}
                />
              ) : fileType === "pdf" ? (
                <iframe
                  src={comprobanteUrl}
                  className="w-full h-full min-h-[500px] rounded-lg border-0"
                  title="Comprobante PDF"
                  onError={() => setError("No se pudo cargar el PDF")}
                  onLoad={() => setLoading(false)}
                />
              ) : (
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Tipo de archivo no soportado para vista previa
                  </p>
                  <Button onClick={handleDownload}>Descargar archivo</Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
