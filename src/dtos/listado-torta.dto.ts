export class ListadoTortaDTO {
  id!: number;
  nombre!: string;
  descripcion!: string;
  precioVenta!: number;
  stockDisponible!: number;
  estado!: boolean;
  fechaCreacion!: Date;
  fechaModificacion!: Date;
  UsuarioCreacion!: string;
  UsuarioModificacion!: string;
  imagenUrl?: string;
  imagenPublicId?: string;
}
