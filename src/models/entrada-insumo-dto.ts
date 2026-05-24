export interface ProveedorListadoDTO {
  id: number;
  nombre: string;
  ruc?: string;
  telefono?: string;
  direccion?: string;
  contacto?: string;
  activo: boolean;
}

export interface ProveedorRequestDTO {
  id: number;
  nombre: string;
  ruc?: string;
  telefono?: string;
  direccion?: string;
  contacto?: string;
  usuario: string;
}

export interface EntradaInsumoDetalleDTO {
  id: number;
  idInsumo: number;
  insumo?: string;
  cantidad: number;
  precioUnitario: number;
}

export interface EntradaInsumoDetalleRequestDTO {
  idInsumo: number;
  cantidad: number;
  precioUnitario: number;
}

export interface EntradaInsumoListadoDTO {
  id: number;
  proveedor?: string;
  numeroDocumento?: string;
  tipoDocumento?: string;
  fechaDocumento?: string;
  imagenDocumento?: string;
  observaciones?: string;
  idEstado: number;
  estado?: string;
  usuarioCreacion?: string;
  fechaCreacion: string;
  usuarioAprobacion?: string;
  fechaAprobacion?: string;
  usuarioRechazo?: string;
  fechaRechazo?: string;
  detalles: EntradaInsumoDetalleDTO[];
}

export interface EntradaInsumoRequestDTO {
  idProveedor?: number;
  numeroDocumento?: string;
  tipoDocumento?: string;
  fechaDocumento?: string;
  imagenBase64?: string;
  observaciones?: string;
  usuario: string;
  detalles: EntradaInsumoDetalleRequestDTO[];
}

export interface EntradaInsumoAprobarDTO {
  id: number;
  usuario: string;
  rol?: string;
}

export interface EntradaInsumoRechazarDTO {
  id: number;
  motivo: string;
  usuario: string;
}

export interface Notificacion {
  tipo: 'success' | 'error' | 'warning' | 'info';
  mensaje: string;
}