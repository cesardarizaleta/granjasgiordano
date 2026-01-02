// Estados y tipos de negocio
export const ESTADOS = {
  VENTA: {
    completado: "completado",
    pendiente: "pendiente",
    procesando: "procesando",
    enviado: "enviado",
    cancelado: "cancelado",
  } as const,

  COBRANZA: {
    pagado: "pagado",
    pendiente_pago: "pendiente_pago",
    vencido: "vencido",
  } as const,

  CLIENTE: {
    empresa: "empresa",
    particular: "particular",
    distribuidor: "distribuidor",
  } as const,
} as const;

export const TIPOS_CLIENTE = [
  { value: ESTADOS.CLIENTE.empresa, label: "Empresa" },
  { value: ESTADOS.CLIENTE.particular, label: "Particular" },
  { value: ESTADOS.CLIENTE.distribuidor, label: "Distribuidor" },
] as const;

export const ESTADOS_VENTA = [
  { value: ESTADOS.VENTA.completado, label: "Completado" },
  { value: ESTADOS.VENTA.pendiente, label: "Pendiente" },
  { value: ESTADOS.VENTA.procesando, label: "Procesando" },
  { value: ESTADOS.VENTA.enviado, label: "Enviado" },
  { value: ESTADOS.VENTA.cancelado, label: "Cancelado" },
] as const;

export const ESTADOS_COBRANZA = [
  { value: ESTADOS.COBRANZA.pagado, label: "Pagado" },
  { value: ESTADOS.COBRANZA.pendiente_pago, label: "Pendiente de Pago" },
  { value: ESTADOS.COBRANZA.vencido, label: "Vencido" },
] as const;
