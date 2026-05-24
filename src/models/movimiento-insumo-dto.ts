// ─────────────────────────────────────────────────────────────────────────────
// DTOs DE LECTURA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Objeto que devuelve GET /ObtenerCombo.
 */
export interface MovimientoInsumoListadoDTO {
  id: number;
  idTipoMovimiento: number;
  tipoMovimiento: string;
  idInsumoLote: number;
  numeroLote: string;
  insumo: string;
  cantidad: number;
  fechaMovimiento: string;
  referencia: string | null;
  activo: string;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
}

/**
 * Objeto que devuelve GET /ObtenerListadoPorId?id=X.
 */
export interface MovimientoInsumoDetalleDTO {
  id: number;
  idTipoMovimiento: number;
  idInsumoLote: number;
  cantidad: number;
  fechaMovimiento: string;
  referencia: string | null;
  activo: boolean;
  usuarioCreacion: string;
  usuarioModificacion: string;
  fechaCreacion: string;
  fechaModificacion: string;
}

/**
 * Objeto que devuelve GET /ObtenerInsumoLote.
 */
export interface InsumoLoteListadoDTO {
  id: number;
  numeroLote: string;
  insumo: string;
  activo: boolean;
  fechaCreacion: string;
  fechaModificacion: string;
  usuarioCreacion: string;
  usuarioModificacion: string;
}

/**
 * Objeto que devuelve GET /TipoMovimiento/ObtenerCombo.
 */
export interface TipoMovimientoListadoDTO {
  id: number;
  nombre: string;
  activo: string;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DTOs DE ESCRITURA
// ─────────────────────────────────────────────────────────────────────────────

export interface MovimientoInsumoRequestDTO {
  id: number;
  activo: boolean;
  usuarioCreacion: string;
  usuarioModificacion: string;
  fechaCreacion: string;
  fechaModificacion: string;
  idTipoMovimiento: number;
  idInsumoLote: number;
  cantidad: number;
  fechaMovimiento: string;
  referencia: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS UI-ONLY
// ─────────────────────────────────────────────────────────────────────────────

export type FormMode = 'crear' | 'editar';

export interface ModalInputData {
  mode: FormMode;
  id?: number;
}

export interface Notificacion {
  tipo: 'exito' | 'error';
  mensaje: string;
}
