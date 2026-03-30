export interface InsumoListadoDTO {
  id: number;
  nombre: string;
  idUnidadMedida: number;
  nombreUnidadMedida: string;
  abreviatura: string;
  stockActual: number;
  stockMinimo: number;
  costoUnitario: number;
}

/**
 * Objeto que devuelve GET /ObtenerListadoPorId?id=X.
 * Usado para pre-cargar el formulario en modo edición.
 */
export interface InsumoDetalleDTO {
  id: number;
  nombre: string;
  idUnidadMedida: number;
  stockActual: number;
  stockMinimo: number;
  costoUnitario: number;
  activo: boolean;
  usuarioCreacion: string;
  usuarioModificacion: string;
  fechaCreacion: string;
  fechaModificacion: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DTOs DE ESCRITURA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Payload para POST /Insertar y POST /Modificar.
 */
export interface InsumoRequestDTO {
  id: number;
  activo: boolean;
  usuarioCreacion: string;
  usuarioModificacion: string;
  fechaCreacion: string;
  fechaModificacion: string;
  nombre: string;
  idUnidadMedida: number;
  stockActual: number;
  stockMinimo: number;
  costoUnitario: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS UI-ONLY
// ─────────────────────────────────────────────────────────────────────────────

export type FormMode = 'crear' | 'editar';

export interface ModalInputData {
  mode: FormMode;
  id?: number;
  idTorta?: number;
}

export interface Notificacion {
  tipo: 'exito' | 'error';
  mensaje: string;
}
