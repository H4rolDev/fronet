/**
 * @file unidad-medida.model.ts
 * @description Modelos e interfaces de datos para el módulo de Unidad de Medida.
 *
 * Centralizar los modelos aquí facilita mantener consistencia entre
 * servicio, componente principal y modal. Si la API cambia un campo,
 * solo debes actualizar este archivo.
 *
 * ─── ESTRUCTURA DE ARCHIVOS ───────────────────────────────────────────────────
 *  unidad-medida.model.ts                          ← estás aquí
 *  unidad-medida.service.ts                        ← llamadas HTTP
 *  admin-unidad-medida.component.ts/html/css       ← listado + acciones
 *  unidad-medida-modal.component.ts/html/css       ← modal crear/editar
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─────────────────────────────────────────────────────────────────────────────
// DTOs DE LECTURA (lo que devuelve la API)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Objeto que devuelve GET /ObtenerCombo.
 * Usado para poblar la tabla del listado.
 */
export interface TipoMovimientoListadoDTO {
  id: number;
  nombre: string;
  activo: boolean;
  fechaCreacion: string;
  usuarioCreacion: string;
  fechaModificacion: string;
  usuarioModificacion: string;
}

/**
 * Objeto que devuelve GET /ObtenerListadoPorId?id=X.
 * Usado para pre-cargar el formulario en modo edición.
 */
export interface TipoMovimientoDetalleDTO {
  id: number;
  nombre: string;
  activo: boolean;
  usuarioCreacion: string;
  usuarioModificacion: string;
  fechaCreacion: string;
  fechaModificacion: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DTOs DE ESCRITURA (lo que envía el front a la API)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Payload para POST /Insertar y POST /Modificar.
 *   id = 0  → el backend interpreta como INSERT
 *   id > 0  → el backend interpreta como UPDATE
 */
export interface TipoMovimientoRequestDTO {
  id: number;
  activo: boolean;
  usuarioCreacion: string;
  usuarioModificacion: string;
  fechaCreacion: string;      // ISO 8601 → "2026-03-29T18:00:00.000Z"
  fechaModificacion: string;  // ISO 8601
  nombre: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS UI-ONLY (no viajan a la API)
// ─────────────────────────────────────────────────────────────────────────────

/** Determina si el modal está en modo creación o edición */
export type FormMode = 'crear' | 'editar';

/** Datos que el componente padre inyecta al modal al abrirlo */
export interface ModalInputData {
  mode: FormMode;
  id?: number; // solo presente en modo 'editar'
}

/** Estructura del toast de feedback al usuario */
export interface Notificacion {
  tipo: 'exito' | 'error' | 'advertencia';
  mensaje: string;
}
