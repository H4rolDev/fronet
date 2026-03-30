/**
 * @file insumo.service.ts
 * @description Servicio que encapsula TODAS las llamadas HTTP al API de Insumos.
 *
 * También reutiliza UnidadMedidaService para cargar el combo de unidades
 * de medida dentro del modal, evitando duplicar lógica HTTP.
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { InsumoDetalleDTO, InsumoListadoDTO, InsumoRequestDTO } from '../models/insumo-dto';

// ─── Configuración ────────────────────────────────────────────────────────────

const BASE_URL   = 'https://localhost:7223/api/Insumo';
const USUARIO    = 'admin'; // reemplazar con tu AuthService

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class InsumoService {

  constructor(private http: HttpClient) {}

  // ── GET /ObtenerCombo ──────────────────────────────────────────────────────
  /**
   * Retorna la lista completa de insumos con nombre de unidad de medida incluido.
   */
  obtenerListado(): Observable<InsumoListadoDTO[]> {
    return this.http
      .get<InsumoListadoDTO[]>(`${BASE_URL}/ObtenerCombo`)
      .pipe(catchError(this.manejarError));
  }

  // ── GET /ObtenerListadoPorId ───────────────────────────────────────────────
  /**
   * Obtiene el detalle completo de un insumo para pre-cargar el formulario
   * en modo edición.
   *
   * @param id - ID del insumo
   */
  obtenerPorId(id: number): Observable<InsumoDetalleDTO> {
    const params = new HttpParams().set('id', id.toString());
    return this.http
      .get<InsumoDetalleDTO>(`${BASE_URL}/ObtenerListadoPorId`, { params })
      .pipe(catchError(this.manejarError));
  }

  // ── POST /Insertar ─────────────────────────────────────────────────────────
  /**
   * Crea un nuevo insumo. id = 0 indica al backend que es un INSERT.
   *
   * @param datos - Campos del formulario
   */
  insertar(datos: {
    nombre: string;
    idUnidadMedida: number;
    stockActual: number;
    stockMinimo: number;
    costoUnitario: number;
  }): Observable<any> {
    const payload: InsumoRequestDTO = {
      id: 0,
      activo: true,
      nombre: datos.nombre.trim(),
      idUnidadMedida: datos.idUnidadMedida,
      stockActual: datos.stockActual,
      stockMinimo: datos.stockMinimo,
      costoUnitario: datos.costoUnitario,
      usuarioCreacion: USUARIO,
      usuarioModificacion: USUARIO,
      fechaCreacion: new Date().toISOString(),
      fechaModificacion: new Date().toISOString(),
    };

    return this.http
      .post<any>(`${BASE_URL}/Insertar`, payload)
      .pipe(catchError(this.manejarError));
  }

  // ── POST /Modificar ────────────────────────────────────────────────────────
  /**
   * Actualiza un insumo existente. Preserva los campos de auditoría originales.
   *
   * @param id      - ID del registro a actualizar
   * @param datos   - Campos actualizados del formulario
   * @param detalle - Detalle original (para preservar fechaCreacion, etc.)
   */
  modificar(
    id: number,
    datos: {
      nombre: string;
      idUnidadMedida: number;
      stockActual: number;
      stockMinimo: number;
      costoUnitario: number;
    },
    detalle: InsumoDetalleDTO
  ): Observable<any> {
    const payload: InsumoRequestDTO = {
      id,
      activo: detalle.activo,
      nombre: datos.nombre.trim(),
      idUnidadMedida: datos.idUnidadMedida,
      stockActual: datos.stockActual,
      stockMinimo: datos.stockMinimo,
      costoUnitario: datos.costoUnitario,
      usuarioCreacion: detalle.usuarioCreacion,
      usuarioModificacion: USUARIO,
      fechaCreacion: detalle.fechaCreacion,
      fechaModificacion: new Date().toISOString(),
    };

    return this.http
      .put<any>(`${BASE_URL}/Modificar`, payload)
      .pipe(catchError(this.manejarError));
  }

  // ── DELETE /Eliminar ───────────────────────────────────────────────────────
  /**
   * Elimina un insumo por su ID.
   * La API recibe id y usuario como query params.
   *
   * @param id - ID del insumo a eliminar
   */
  eliminar(id: number): Observable<any> {
    const params = new HttpParams()
      .set('id', id.toString())
      .set('usuario', USUARIO);

    return this.http
      .delete<any>(`${BASE_URL}/Eliminar`, { params })
      .pipe(catchError(this.manejarError));
  }

  // ── Error handler ──────────────────────────────────────────────────────────
  private manejarError(error: any): Observable<never> {
    let mensaje = 'Ocurrió un error inesperado. Intenta de nuevo.';

    if (error.status === 0)          mensaje = 'No se puede conectar al servidor.';
    else if (error.status === 400)   mensaje = error.error?.message ?? 'Datos inválidos.';
    else if (error.status === 404)   mensaje = 'El recurso solicitado no existe.';
    else if (error.status === 409)   mensaje = 'Ya existe un insumo con ese nombre.';
    else if (error.status >= 500)    mensaje = 'Error del servidor. Contacta al administrador.';

    console.error('[InsumoService]', error);
    return throwError(() => new Error(mensaje));
  }
}
