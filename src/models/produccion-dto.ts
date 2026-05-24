/**
 * @file produccion.model.ts
 * @description Modelos e interfaces para el módulo de Producción de Tortas.
 *
 * ─── REGLAS DE NEGOCIO ────────────────────────────────────────────────────────
 *  ❌ PRODUCCIÓN NO SE EDITA NI ELIMINA — es historial inmutable.
 *  ✅ CORRECCIONES vía: AjustarInsumo | AjustarTorta (endpoints separados).
 *
 * ─── FLUJO DE PRODUCCIÓN ─────────────────────────────────────────────────────
 *  1. El backend valida stock de insumos por lotes (FIFO por vencimiento).
 *  2. Descuenta automáticamente de lotes activos no vencidos.
 *  3. Registra movimientos de salida de insumos y entrada de torta.
 *  4. Incrementa StockDisponible de la torta.
 */

// ─────────────────────────────────────────────────────────────────────────────
// DTOs DE LECTURA
// ─────────────────────────────────────────────────────────────────────────────

export interface ProduccionCabeceraDTO {
  id: number;
  idTorta: number;
  nombreTorta: string;
  cantidadProducida: number;
  fechaProduccion: string;
  observacion: string | null;
  usuarioCreacion: string;
  activo: boolean;
}

export interface ProduccionDetalleHeaderDTO {
  id: number;
  idTorta: number;
  fecha: string;
  cantidadProducida: number;
  observacion: string | null;
  activo: boolean;
}

export interface ProduccionDetalleInsumoDTO {
  idInsumo: number;
  nombreInsumo: string;
  cantidadUsada: number;
  unidadMedida?: string;
}

export interface TortaDetalleDTO {
  id: number;
  idCategoriaTorta: number;
  nombre: string;
  descripcion: string | null;
  stockDisponible: number;
  precioVenta: number | null;
  esPersonalizable: boolean | null;
  imagenUrl: string | null;
  activo: boolean;
}

export interface CategoriaTortaDTO {
  id: number;
  nombre: string;
}

export interface TortaComboDTO {
  id: number;
  nombre: string;
  idCategoriaTorta: number;
  stockDisponible: number;
}

export interface InsumoComboDTO {
  id: number;
  nombre: string;
  nombreUnidadMedida: string;
  abreviatura: string;
  stockDisponible: number;
  activo: boolean;
}

export interface RecetaTortaItemDTO {
  idInsumo: number;
  nombreInsumo: string;
  cantidadRequerida: number;
  unidadMedida?: string;
}

export interface InsertarProduccionDTO {
  idTorta: number;
  cantidadProducida: number;
  observacion: string | null;
  usuarioCreacion: string;
}

export interface AjusteInsumoDTO {
  idInsumo: number;
  cantidad: number;
  esEntrada: boolean;
  usuario: string;
  observacion: string | null;
}

export interface AjusteTortaDTO {
  idTorta: number;
  cantidad: number;
  esEntrada: boolean;
  usuario: string;
  observacion: string | null;
}

// TIPOS UI-ONLY
export type ModalProduccion =
  | 'ninguno'
  | 'crear'
  | 'detalle'
  | 'ajuste-insumo'
  | 'ajuste-torta';

export interface Notificacion {
  tipo: 'exito' | 'error';
  mensaje: string;
}

export interface FiltrosProduccion {
  busqueda: string;
  fechaDesde: string | null;
  fechaHasta: string | null;
}

export interface DetalleModalData {
  cabecera: ProduccionCabeceraDTO;
}
