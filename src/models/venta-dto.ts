/**
 * @file venta.model.ts
 * @description Modelos e interfaces para el módulo de Ventas de Tortas.
 *
 * ─── ENTIDADES DEL DOMINIO ───────────────────────────────────────────────────
 *  Venta (cabecera)
 *    ├── DetalleVenta[]   (tortas vendidas)
 *    ├── PagoVenta[]      (métodos de pago — puede ser múltiple)
 *    ├── EntregaVenta     (delivery, solo si idTipoEntrega = 2)
 *    └── ComprobanteVenta (boleta / factura)
 *
 * ─── TIPOS DE ENTREGA ────────────────────────────────────────────────────────
 *  1 = Recojo en tienda  (sin datos de delivery)
 *  2 = Delivery          (requiere dirección, teléfono, repartidor, costo)
 *
 * ─── ESTADOS DE VENTA ────────────────────────────────────────────────────────
 *  1 = Pendiente  2 = Completado  3 = Cancelado
 */

// ─────────────────────────────────────────────────────────────────────────────
// DTOs DE LECTURA
// ─────────────────────────────────────────────────────────────────────────────

/** Fila del listado principal (GET /Listado) */
export interface VentaListadoDTO {
  id: number;
  fechaVenta: string;       // ISO date
  total: number;
  idEstadoVenta: number;    // 1=Pendiente 2=Completado 3=Cancelado
  idTipoEntrega: number;    // 1=Recojo 2=Delivery
}

/** Detalle completo de una venta (GET /Detalle?idVenta=X) */
export interface VentaDetalleDTO {
  venta: VentaCabeceraDetalle;
  cliente: { id: number; nombre: string; documento: string } | null;
  detalles: DetalleItemDTO[];
  pagos: PagoItemDTO[];
  delivery: DeliveryItemDTO | null;
  comprobante: { serie: string; numero: string; idTipoComprobante: number } | null;
}

export interface VentaCabeceraDetalle {
  id: number;
  fechaVenta: string;
  idEstadoVenta: number;
  idTipoEntrega: number;
  total: number;
  usuario: string;
  observacion?: string;
}

export interface DetalleItemDTO {
  idTorta: number;
  torta: string;
  cantidad: number;
  precioBase: number;
  precioPersonalizacion: number;
  precioFinal: number;
  subTotal: number;
  mensaje?: string;
}

export interface PagoItemDTO {
  idMetodoPago: number;
  nombreMetodo: string;
  monto: number;
  numeroOperacion?: string;
}

export interface DeliveryItemDTO {
  idPersonalRepartidor?: number;
  nombreRepartidor?: string;
  direccion: string;
  telefono: string;
  costoDelivery: number;
}

/** Comprobante para impresión (GET /Comprobante?idVenta=X) */
export interface ComprobanteDTO {
  idVenta: number;
  fecha: string;
  cliente: string;
  tipoComprobante: string;
  serieNumero: string;
  detalles: ComprobanteDetalleDTO[];
  subTotal: number;
  total: number;
  tipoEntrega: string;
  direccion?: string;
  pagos: ComprobantePagoDTO[];
}

export interface ComprobanteDetalleDTO {
  torta: string;
  cantidad: number;
  precioUnitario: number;
  subTotal: number;
}

export interface ComprobantePagoDTO {
  metodo: string;
  monto: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// DTOs DE ESCRITURA
// ─────────────────────────────────────────────────────────────────────────────

/** POST /Registrar */
export interface RegistrarVentaDTO {
  idPersona: number;
  idTipoEntrega: 1 | 2;
  usuario: string;
  imagenComprobante?: string;
  numeroOperacion?: string;
  detalles: RegistrarDetalleDTO[];
  pagos: RegistrarPagoDTO[];
  entrega: RegistrarEntregaDTO | null;
  comprobante?: RegistrarComprobanteDTO;
}

export interface RegistrarDetalleDTO {
  idTorta: number;
  cantidad: number;
  precioBase: number;
  precioPersonalizacion: number;
  mensaje: string;
}

export interface RegistrarPagoDTO {
  idMetodoPago: number;
  monto: number;
  numeroOperacion: string;
}

export interface RegistrarEntregaDTO {
  idPersonalRepartidor: number;
  direccion: string;
  referencia?: string;
  telefono: string;
  nombreContacto?: string;
  costoDelivery: number;
}

export interface RegistrarComprobanteDTO {
  idTipoComprobante: number;
  serie: string;
  numero: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CATÁLOGOS (combos)
// ─────────────────────────────────────────────────────────────────────────────

export interface TortaVentaDTO {
  id: number;
  nombre: string;
  precioVenta: number;
  stockDisponible: number;
  imagenUrl: string | null;
}

export interface PersonaComboDTO {
  id: number;
  idRol: number;
  nombreRol: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  numeroDocumento: string;
}

export interface MetodoPagoDTO {
  id: number;
  nombre: string;
}

export interface TipoComprobanteDTO {
  id: number;
  nombre: string;     // "Boleta", "Factura", "Ticket"
}

export interface RepartidorDTO {
  id: number;
  nombre: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS UI-ONLY
// ─────────────────────────────────────────────────────────────────────────────

export type EstadoVenta = 'pendiente' | 'completado' | 'cancelado';
export type TipoEntrega = 'recojo' | 'delivery';
export type FiltroVentas = 'todos' | 'pendiente' | 'completado' | 'cancelado';

export interface Notificacion {
  tipo: 'exito' | 'error';
  mensaje: string;
}

/** Fila editable de detalle en el formulario de nueva venta */
export interface FilaDetalle {
  _uid: number;
  idTorta: number | null;
  cantidad: number;
  precioBase: number;
  precioPersonalizacion: number;
  mensaje: string;
  subtotal: number;       // calculado: (precioBase + precioPersonalizacion) * cantidad
}

/** Fila editable de pago en el formulario */
export interface FilaPago {
  _uid: number;
  idMetodoPago: number | null;
  monto: number;
  numeroOperacion: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export const ESTADO_LABEL: Record<number, string> = {
  1: 'Pendiente',
  2: 'Completado',
  3: 'Cancelado',
};

export const ENTREGA_LABEL: Record<number, string> = {
  1: 'Recojo en tienda',
  2: 'Delivery',
};

export const ESTADO_CLASE: Record<number, string> = {
  1: 'badge--pendiente',
  2: 'badge--completado',
  3: 'badge--cancelado',
};
