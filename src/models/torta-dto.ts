// ─────────────────────────────────────────────────────────────────────────────
// DTOs DE LECTURA
// ─────────────────────────────────────────────────────────────────────────────

import { InsumoListadoDTO } from "./insumo-dto";

export interface TortaListadoDTO {
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

export interface TortaDetalleDTO {
  id: number;
  idCategoriaTorta: number;
  nombre: string;
  descripcion: string | null;
  cantidades: string | null;
  stockDisponible: number;
  precioVenta: number | null;
  esPersonalizable: boolean | null;
  imagenUrl: string | null;
  imagenPublicId: string | null;
  activo: boolean;
  usuarioCreacion: string;
  usuarioModificacion: string;
  fechaCreacion: string;
  fechaModificacion: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// DTOs DE ESCRITURA
// ─────────────────────────────────────────────────────────────────────────────

export interface TortaRequestDTO {
  id: number;
  idCategoriaTorta: number;
  nombre: string;
  descripcion: string | null;
  cantidades: string | null;
  stockDisponible: number;
  precioVenta: number | null;
  esPersonalizable: boolean | null;
  imagenUrl: string | null;
  imagenPublicId: string | null;
  activo: boolean;
  usuarioCreacion: string;
  usuarioModificacion: string;
  fechaCreacion: string;
  fechaModificacion: string;
}

export interface CategoriaTortaListadoDTO {
  id: number;
  nombre: string;
  activo: boolean;
  fechaCreacion: string;
  usuarioCreacion: string | null;
  fechaModificacion: string;
  usuarioModificacion: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS UI-ONLY
// ─────────────────────────────────────────────────────────────────────────────

export type FormMode = 'crear' | 'editar';

export interface ModalInputData {
  mode: FormMode;
  id?: number;
  fila?: InsumoListadoDTO;
}

export interface Notificacion {
  tipo: 'exito' | 'error';
  mensaje: string;
}
