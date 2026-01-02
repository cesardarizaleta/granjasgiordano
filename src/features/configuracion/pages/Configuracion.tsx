import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, Database } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { configService } from "@/services";
import type { ConfiguracionNotificaciones, ConfiguracionSistema } from "@/services";

const Configuracion = () => {
  const { user } = useAuth();
  const [notificacionesConfig, setNotificacionesConfig] =
    useState<ConfiguracionNotificaciones | null>(null);
  const [sistemaConfig, setSistemaConfig] = useState<ConfiguracionSistema | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadConfigurations();
    }
  }, [user]);

  const loadConfigurations = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [notifRes, sistemaRes] = await Promise.all([
        configService.getNotificacionesConfig(user.id),
        configService.getSistemaConfig(user.id),
      ]);

      if (notifRes.data) setNotificacionesConfig(notifRes.data);
      if (sistemaRes.data) setSistemaConfig(sistemaRes.data);
    } catch (error) {
      console.error("Error loading configurations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotificaciones = async () => {
    if (!notificacionesConfig || !user?.id) return;
    const result = await configService.updateNotificacionesConfig(notificacionesConfig);
    if (result.error) {
      console.error("Error saving notificaciones config:", result.error);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6 max-w-4xl">
          <div className="animate-fade-in">
            <h1 className="text-3xl font-display font-bold text-foreground">Configuración</h1>
            <p className="text-muted-foreground">Cargando configuraciones...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-display font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground">Ajustes del sistema y preferencias</p>
        </div>

        {/* Notifications */}
        <Card className="animate-slide-up">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display">Notificaciones</CardTitle>
                <CardDescription>Configurar alertas del sistema</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Stock bajo</p>
                <p className="text-sm text-muted-foreground">
                  Alerta cuando el inventario esté bajo
                </p>
              </div>
              <Switch
                checked={notificacionesConfig?.stock_bajo || false}
                onCheckedChange={checked =>
                  setNotificacionesConfig(prev => (prev ? { ...prev, stock_bajo: checked } : null))
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Facturas vencidas</p>
                <p className="text-sm text-muted-foreground">Recordatorios de cobranza</p>
              </div>
              <Switch
                checked={notificacionesConfig?.facturas_vencidas || false}
                onCheckedChange={checked =>
                  setNotificacionesConfig(prev =>
                    prev ? { ...prev, facturas_vencidas: checked } : null
                  )
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Nuevas ventas</p>
                <p className="text-sm text-muted-foreground">Notificar cada nueva venta</p>
              </div>
              <Switch
                checked={notificacionesConfig?.nuevas_ventas || false}
                onCheckedChange={checked =>
                  setNotificacionesConfig(prev =>
                    prev ? { ...prev, nuevas_ventas: checked } : null
                  )
                }
              />
            </div>
            <Button className="mt-4" onClick={handleSaveNotificaciones}>
              Guardar Cambios
            </Button>
          </CardContent>
        </Card>

        {/* System */}
        <Card className="animate-slide-up">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-display">Sistema</CardTitle>
                <CardDescription>Información técnica</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Versión</p>
                <p className="font-medium">{sistemaConfig?.version || "1.0.0"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Base de Datos</p>
                <p
                  className={`font-medium ${sistemaConfig?.db_conectada ? "text-success" : "text-warning"}`}
                >
                  {sistemaConfig?.db_conectada ? "Conectada" : "No conectada"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Última actualización</p>
                <p className="font-medium">
                  {sistemaConfig?.ultima_actualizacion || new Date().toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Estado</p>
                <p
                  className={`font-medium ${sistemaConfig?.estado === "Operativo" ? "text-success" : "text-warning"}`}
                >
                  {sistemaConfig?.estado || "Operativo"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Configuracion;
