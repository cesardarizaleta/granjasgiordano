// Constantes de UI y componentes
export const BADGE_VARIANTS = {
  estadoBadgeVariant: {
    completado: "default",
    pendiente: "secondary",
    procesando: "outline",
    enviado: "outline",
    cancelado: "destructive",
    pagado: "default",
    pendiente_pago: "secondary",
    vencido: "destructive",
  } as const,

  tipoBadgeVariant: {
    empresa: "default",
    particular: "secondary",
    distribuidor: "outline",
  } as const,
} as const;

export type EstadoBadgeVariant = typeof BADGE_VARIANTS.estadoBadgeVariant;
export type TipoBadgeVariant = typeof BADGE_VARIANTS.tipoBadgeVariant;
