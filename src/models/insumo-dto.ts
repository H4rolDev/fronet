/**
 * @file insumo.model.ts
 * @description Modelos e interfaces para el módulo de Insumos.
 *
 * ─── ARQUITECTURA ────────────────────────────────────────────────────────────
 *
 *  INSUMO (catálogo)
 *    └── LOTE 1  (stock por lote)
 *    └── LOTE 2
 *    └── ...
 *
 *  Un insumo puede tener múltiples lotes.
 *  El stockDisponible viene calculado desde el backend (suma de lotes activos).
 *  Los movimientos son internos (entrada/salida) — no visibles en UI.
 *
 * ─── ELIMINACIÓN LÓGICA ──────────────────────────────────────────────────────
 *  No se borra físicamente nada.
 *  - DesactivarInsumo: solo si stockDisponible === 0
 *  - DesactivarLote:   solo si cantidadDisponible === 0
 *  - ActivarInsumo:    cambia solo el insumo
 *  - ActivarLote:      requiere insumo activo + lote no vencido
 */

// ─────────────────────────────────────────────────────────────────────────────
// DTOs DE LECTURA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fila del listado principal (GET /ObtenerCombo).
 * Una fila = un insumo (no un lote).
 */
export interface InsumoListadoDTO {
  id: number;
  nombre: string;
  idUnidadMedida: number;
  nombreUnidadMedida: string;
  abreviatura: string;
  stockDisponible: number;  // calculado en backend (suma de lotes activos)
  activo: boolean;
}

/**
 * Detalle de un insumo (GET /ObtenerListadoPorId?id=X).
 * Usado para el formulario de edición del insumo.
 */
export interface InsumoDetalleDTO {
  id: number;
  nombre: string;
  idUnidadMedida: number;
  stockActual: number;
  stockMinimo: number;
  costoUnitario: number;
  activo: boolean;
}

/**
 * Un lote de insumo (GET /ObtenerLotesPorInsumo?idInsumo=X).
 * Usado en la tabla de lotes dentro del modal de detalle.
 */
export interface InsumoLoteDTO {
  id: number;                      // idInsumoLote
  idInsumo: number;
  numeroLote: string;              // "LOT-000003", generado por backend
  fechaIngreso: string;            // ISO date
  fechaVencimiento: string | null; // ISO date o null
  cantidadInicial: number;
  cantidadDisponible: number;
  costoUnitario: number;
  activo: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// DTOs DE ESCRITURA
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Payload para POST /InsertarMultipleTabla (crear insumo + primer lote).
 *
 * Reglas del backend:
 *   - Si idInsumo > 0 → usa insumo existente
 *   - Si idInsumo = 0 → crea insumo nuevo (nombre + idUnidadMedida requeridos)
 *   - cantidadDisponible no puede superar cantidadInicial
 *   - cantidadInicial > 0, cantidadDisponible > 0, costoUnitario > 0
 *   - No puede existir otro insumo activo con el mismo nombre (case-insensitive)
 */
export interface InsertarLoteInsumoDTO {
  nombre: string;
  idLote: number;             // 0 al crear
  idUnidadMedida: number;
  idInsumo: number;           // 0 = crear nuevo, >0 = usar existente
  numeroLote: string;         // ignorado en creación, backend lo genera
  fechaVencimiento: string | null;
  cantidadInicial: number;
  cantidadDisponible: number;
  costoUnitario: number;
  usuario: string;
}

/**
 * Payload para PUT /ActualizarLoteInsumo.
 * Solo se modifican: cantidadInicial, cantidadDisponible, costoUnitario, fechaVencimiento.
 * El backend genera un movimiento automático si cambia cantidadDisponible.
 */
export interface ActualizarLoteInsumoDTO {
  nombre: string;
  idLote: number;             // idInsumoLote del lote a actualizar
  idUnidadMedida: number;
  idInsumo: number;
  numeroLote: string;
  fechaVencimiento: string | null;
  cantidadInicial: number;
  cantidadDisponible: number;
  costoUnitario: number;
  usuario: string;
}

/**
 * Payload para PUT /ActualizarInsumo (editar nombre/unidad del insumo).
 * Ajustar según tu endpoint real de edición de insumo.
 */
export interface ActualizarInsumoDTO {
  id: number;
  nombre: string;
  idUnidadMedida: number;
  usuario: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS UI-ONLY
// ─────────────────────────────────────────────────────────────────────────────

/** Qué modal está abierto en un momento dado */
export type ModalActivo =
  | 'ninguno'
  | 'crear-insumo'       // nuevo insumo + primer lote
  | 'editar-insumo'      // editar nombre/unidad del insumo
  | 'detalle-lotes'      // tabla de lotes del insumo
  | 'nuevo-lote'         // agregar lote a insumo existente
  | 'editar-lote'        // editar un lote existente
  | 'confirmar-desact-insumo'
  | 'confirmar-act-insumo'
  | 'confirmar-desact-lote'
  | 'confirmar-act-lote';

export interface Notificacion {
  tipo: 'exito' | 'error';
  mensaje: string;
}

/** Filtro de estado aplicado en la tabla principal */
export type FiltroEstado = 'todos' | 'activos' | 'inactivos';
