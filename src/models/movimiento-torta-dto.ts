// ─────────────────────────────────────────────────────────────────────────────
// DTOs DE LECTURA
// ─────────────────────────────────────────────────────────────────────────────

export interface MovimientoTortaListadoDTO {
  id: number;
  idTipoMovimiento: number;
  tipoMovimiento: string;
  idTorta: number;
  torta: string;
  cantidad: number;
  fechaMovimiento: string;
  referencia: string | null;
  activo: string | null;
  fechaCreacion: string | null;
  usuarioCreacion: string | null;
  fechaModificacion: string | null;
  usuarioModificacion: string | null;
}

export interface MovimientoTortaDetalleDTO {
  id: number;
  idTipoMovimiento: number;
  idTorta: number;
  cantidad: number;
  fechaMovimiento: string;
  referencia: string | null;
  activo: boolean;
  usuarioCreacion: string;
  usuarioModificacion: string;
  fechaCreacion: string;
  fechaModificacion: string;
}

/** DTO del combo de tortas (GET /Torta/ObtenerCombo) */
export interface TortaComboDTO {
  id: number;
  nombre: string;
  idCategoriaTorta: number;
  nombreCategoriaTorta: string;
  descripcion: string | null;
  cantidades: string | null;
  precioVenta: number | null;
  imagenUrl: string | null;
  imagenPublicId: string | null;
  esPersonalizable: boolean | null;
  stockDisponible: number;
  activo: string;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
}

/** DTO del combo de tipos de movimiento (GET /TipoMovimiento/ObtenerCombo) */
export interface TipoMovimientoDTO {
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

export interface MovimientoTortaRequestDTO {
  id: number;
  activo: boolean;
  usuarioCreacion: string;
  usuarioModificacion: string;
  fechaCreacion: string;
  fechaModificacion: string;
  idTipoMovimiento: number;
  idTorta: number;
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
