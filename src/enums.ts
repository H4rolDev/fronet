export enum RolEnum {
  Administrador = 1,
  Atencion = 2,
  Produccion = 3,
  Repartidor = 4,
  Cliente = 5
}

export enum EstadoVentaEnum {
  Pendiente = 1,
  EsperandoValidacion = 2,
  Aprobada = 3,
  Rechazada = 4,
  Pagada = 5,
  Cancelada = 6
}

export enum EstadoEntregaEnum {
  Pendiente = 1,
  Asignado = 2,
  Aceptado = 3,
  EnCamino = 4,
  Entregado = 5,
  Cancelado = 6
}

export enum EstadoProduccionEnum {
  Pendiente = 1,
  EnProceso = 2,
  Completada = 3,
  Cancelada = 4
}

export enum EstadoInsumoEnum {
  Normal = 1,
  Bajo = 2,
  Agotado = 3
}

export enum EstadoEntradaInsumoEnum {
  Pendiente = 1,
  Aprobado = 2,
  Rechazado = 3
}

export enum TipoMovimientoEnum {
  Entrada = 1,
  Salida = 2,
  Produccion = 3,
  AjusteEntrada = 4,
  AjusteSalida = 5,
  Venta = 6,
  Anulacion = 7,
  Merma = 8,
  Regalo = 9,
  Descarga = 10,
  Donacion = 11
}

export enum TipoEntregaEnum {
  RecojoTienda = 1,
  Delivery = 2
}

export enum MetodoPagoEnum {
  Efectivo = 1,
  Yape = 2,
  Plin = 3,
  Tarjeta = 4
}

export const ROL_NOMBRES: Record<RolEnum, string> = {
  [RolEnum.Administrador]: 'Administrador',
  [RolEnum.Atencion]: 'Atención',
  [RolEnum.Produccion]: 'Producción',
  [RolEnum.Repartidor]: 'Repartidor',
  [RolEnum.Cliente]: 'Cliente'
};

export const ESTADO_ENTREGA_NOMBRES: Record<EstadoEntregaEnum, string> = {
  [EstadoEntregaEnum.Pendiente]: 'Pendiente',
  [EstadoEntregaEnum.Asignado]: 'Asignado',
  [EstadoEntregaEnum.Aceptado]: 'Aceptado',
  [EstadoEntregaEnum.EnCamino]: 'En Camino',
  [EstadoEntregaEnum.Entregado]: 'Entregado',
  [EstadoEntregaEnum.Cancelado]: 'Cancelado'
};

export const ESTADO_VENTA_NOMBRES: Record<EstadoVentaEnum, string> = {
  [EstadoVentaEnum.Pendiente]: 'Pendiente',
  [EstadoVentaEnum.EsperandoValidacion]: 'Esperando Validación',
  [EstadoVentaEnum.Aprobada]: 'Aprobada',
  [EstadoVentaEnum.Rechazada]: 'Rechazada',
  [EstadoVentaEnum.Pagada]: 'Pagada',
  [EstadoVentaEnum.Cancelada]: 'Cancelada'
};