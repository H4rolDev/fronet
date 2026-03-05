export interface Torta {
  id: number;
  nombre: string;
  descripcion: string;
  precioVenta: number;
  stockDisponible: number;
  imagenUrl?: string;
  imagenPublicId?: string;
  estado: boolean;
  usuarioCreacion: string;
  usuarioModificacion?: string;
  fechaCreacion?: string;
  fechaModificacion?: string;
}

export interface TortaListadoDTO {
  id: number;
  nombre: string;
}

export interface TortaForm {
  id: number;
  nombre: string;
  descripcion: string;
  precioVenta: number | null;
  stockDisponible: number | null;
  imagenUrl?: string;
  imagenPublicId?: string;
  estado: boolean;
  usuarioCreacion: string;
  usuarioModificacion?: string;
  fechaCreacion: string;
  fechaModificacion: string;
}
