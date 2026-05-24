/**
 * @file receta-torta.model.ts
 * @description Modelos e interfaces para el módulo de Recetas de Torta.
 *
 * La API maneja la receta de una torta como un conjunto de filas (una por
 * insumo). El POST y PUT envían TODOS los detalles de la torta en un solo
 * request (InsertarMultipleTabla / ActualizarMultipleTabla), reemplazando
 * la receta completa. No existe un endpoint de eliminar fila individual:
 * se re-envía la lista sin el insumo eliminado.
 */

// ─────────────────────────────────────────────────────────────────────────────
// DTOs DE LECTURA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fila individual del listado (ObtenerCombo).
 * Cada fila representa un insumo de la receta de una torta.
 */
export interface RecetaTortaListadoDTO {
  id: number;
  idTorta: number;
  nombreTorta: string;
  idInsumo: number;
  nombreInsumo: string;
  cantidadRequerida: number;
  activo: boolean;
  usuarioCreacion: string;
  usuarioModificacion: string;
  fechaCreacion: string;
  fechaModificacion: string;
}

/**
 * Fila individual del detalle por ID (ObtenerListadoPorId).
 */
export interface RecetaTortaDetalleDTO {
  id: number;
  idTorta: number;
  idInsumo: number;
  cantidadNecesaria: number;
  activo: boolean;
  usuarioCreacion: string;
  usuarioModificacion: string;
  fechaCreacion: string;
  fechaModificacion: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DTOs DE ESCRITURA
// ─────────────────────────────────────────────────────────────────────────────

/** Un insumo dentro del payload de insertar/actualizar */
export interface InsumoDetalleInsertDTO {
  idInsumo: number;
  cantidadRequerida: number;
}

/**
 * Payload completo para POST /InsertarMultipleTabla y PUT /ActualizarMultipleTabla.
 * Se envían todos los insumos de la torta en un solo request.
 */
export interface RecetaTortaRequestDTO {
  usuarioCreacion: string;
  idTorta: number;
  detalles: InsumoDetalleInsertDTO[];
}

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS UI-ONLY
// ─────────────────────────────────────────────────────────────────────────────

export type FormMode = 'crear' | 'editar';

export interface ModalInputData {
  mode: FormMode;
  /** En edición: id de la torta cuya receta se edita */
  idTorta?: number;
  /** En edición: nombre de la torta (para mostrarlo como fijo) */
  nombreTorta?: string;
}

export interface Notificacion {
  tipo: 'exito' | 'error';
  mensaje: string;
}

/**
 * Representa una fila editable dentro del modal.
 * Extiende el DTO con un id temporal para el trackBy del ngFor.
 */
export interface FilaIngrediente {
  /** ID temporal local (no va a la API); se usa para trackBy */
  _uid: number;
  idInsumo: number | null;
  cantidadRequerida: number | null;
  /** true = fila recién agregada en esta sesión de edición */
  esNueva: boolean;
  /** Abreviatura de la unidad de medida del insumo */
  abreviatura: string;
}

/**
 * Agrupación de filas por torta para mostrar en el listado de cards.
 */
export interface RecetaAgrupada {
  idTorta: number;
  nombreTorta: string;
  ingredientes: RecetaTortaListadoDTO[];
  ultimaModificacion: string;
  usuarioCreacion: string;
}
