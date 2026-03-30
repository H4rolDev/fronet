import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TortaDetalleDTO, TortaListadoDTO, TortaRequestDTO } from '../models/torta-dto';

// ─── Configuración ────────────────────────────────────────────────────────────

const BASE_URL = 'https://localhost:7223/api/Torta';
const USUARIO  = 'admin'; // reemplazar con tu AuthService

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class TortaService {

  constructor(private http: HttpClient) {}

  // ── GET /ObtenerCombo ──────────────────────────────────────────────────────
  obtenerListado(): Observable<TortaListadoDTO[]> {
    return this.http
      .get<TortaListadoDTO[]>(`${BASE_URL}/ObtenerCombo`)
      .pipe(catchError(this.manejarError));
  }

  // ── GET /ObtenerListadoPorId ───────────────────────────────────────────────
  obtenerPorId(id: number): Observable<TortaDetalleDTO> {
    const params = new HttpParams().set('id', id.toString());
    return this.http
      .get<TortaDetalleDTO>(`${BASE_URL}/ObtenerListadoPorId`, { params })
      .pipe(catchError(this.manejarError));
  }

  // ── POST /InsertarConImagenLote ────────────────────────────────────────────
  insertar(
    datos: {
      idCategoriaTorta: number;
      nombre: string;
      descripcion: string | null;
      cantidades: string | null;
      stockDisponible: number;
      precioVenta: number | null;
      esPersonalizable: boolean;
    },
    imagen: File | null
  ): Observable<any> {
    const payload: TortaRequestDTO = {
      id: 0,
      activo: true,
      idCategoriaTorta: datos.idCategoriaTorta,
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion?.trim() || null,
      cantidades: datos.cantidades?.trim() || null,
      stockDisponible: datos.stockDisponible,
      precioVenta: datos.precioVenta,
      esPersonalizable: datos.esPersonalizable,
      imagenUrl: null,
      imagenPublicId: null,
      usuarioCreacion: USUARIO,
      usuarioModificacion: USUARIO,
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString(),
    };

    return this.http
      .post<any>(`${BASE_URL}/InsertarConImagenLote`, this.buildFormData(payload, imagen))
      .pipe(catchError(this.manejarError));
  }

  // ── PUT /ModificarConImagenLote ────────────────────────────────────────────
  modificar(
    id: number,
    datos: {
      idCategoriaTorta: number;
      nombre: string;
      descripcion: string | null;
      cantidades: string | null;
      stockDisponible: number;
      precioVenta: number | null;
      esPersonalizable: boolean;
    },
    detalle: TortaDetalleDTO,
    imagen: File | null
  ): Observable<any> {
    const payload: TortaRequestDTO = {
      id,
      activo: detalle.activo,
      idCategoriaTorta: datos.idCategoriaTorta,
      nombre: datos.nombre.trim(),
      descripcion: datos.descripcion?.trim() || null,
      cantidades: datos.cantidades?.trim() || null,
      stockDisponible: datos.stockDisponible,
      precioVenta: datos.precioVenta,
      esPersonalizable: datos.esPersonalizable,
      imagenUrl: detalle.imagenUrl,
      imagenPublicId: detalle.imagenPublicId,
      usuarioCreacion: detalle.usuarioCreacion,
      usuarioModificacion: USUARIO,
      fechaCreacion: detalle.fechaCreacion,
      fechaModificacion: new Date().toISOString(),
    };

    return this.http
      .put<any>(`${BASE_URL}/ModificarConImagenLote`, this.buildFormData(payload, imagen))
      .pipe(catchError(this.manejarError));
  }

  // ── DELETE /Eliminar ───────────────────────────────────────────────────────
  eliminar(id: number): Observable<any> {
    const params = new HttpParams()
      .set('id', id.toString())
      .set('usuario', USUARIO);

    return this.http
      .delete<any>(`${BASE_URL}/Eliminar`, { params })
      .pipe(catchError(this.manejarError));
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private buildFormData(payload: TortaRequestDTO, imagen: File | null): FormData {
    const fd = new FormData();
    fd.append('id',                  payload.id.toString());
    fd.append('activo',              payload.activo.toString());
    fd.append('idCategoriaTorta',    payload.idCategoriaTorta.toString());
    fd.append('nombre',              payload.nombre);
    fd.append('descripcion',         payload.descripcion ?? '');
    fd.append('cantidades',          payload.cantidades ?? '');
    fd.append('stockDisponible',     payload.stockDisponible.toString());
    fd.append('precioVenta',         payload.precioVenta?.toString() ?? '');
    fd.append('esPersonalizable',    (payload.esPersonalizable ?? false).toString());
    fd.append('imagenUrl',           payload.imagenUrl ?? '');
    fd.append('imagenPublicId',      payload.imagenPublicId ?? '');
    fd.append('usuarioCreacion',     payload.usuarioCreacion);
    fd.append('usuarioModificacion', payload.usuarioModificacion);
    fd.append('fechaCreacion',       payload.fechaCreacion);
    fd.append('fechaModificacion',   payload.fechaModificacion);
    if (imagen) fd.append('imagen', imagen, imagen.name);
    return fd;
  }

  // ── Error handler ──────────────────────────────────────────────────────────
  private manejarError(error: any): Observable<never> {
    let mensaje = 'Ocurrió un error inesperado. Intenta de nuevo.';
    if (error.status === 0)        mensaje = 'No se puede conectar al servidor.';
    else if (error.status === 400) mensaje = error.error?.message ?? 'Datos inválidos.';
    else if (error.status === 404) mensaje = 'El recurso solicitado no existe.';
    else if (error.status === 409) mensaje = 'Ya existe una torta con ese nombre.';
    else if (error.status >= 500)  mensaje = 'Error del servidor. Contacta al administrador.';
    console.error('[TortaService]', error);
    return throwError(() => new Error(mensaje));
  }
}
