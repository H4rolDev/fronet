/**
 * @file movimiento-insumo.service.ts
 * @description Servicio que encapsula TODAS las llamadas HTTP al API de MovimientoInsumo.
 * No tiene endpoint de eliminación por diseño del negocio.
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  MovimientoInsumoListadoDTO,
  MovimientoInsumoDetalleDTO,
  MovimientoInsumoRequestDTO,
  InsumoLoteListadoDTO,
} from '../models/movimiento-insumo-dto';
import { environment } from '../environments/environment';

const BASE_URL      = `${environment.apiUrl}/MovimientoInsumo`;
const TIPO_MOV_URL  = `${environment.apiUrl}/TipoMovimiento`;
const USUARIO       = 'admin'; // reemplazar con tu AuthService

@Injectable({ providedIn: 'root' })
export class MovimientoInsumoService {

  constructor(private http: HttpClient) {}

  // ── GET /ObtenerCombo ──────────────────────────────────────────────────────
  obtenerListado(): Observable<MovimientoInsumoListadoDTO[]> {
    return this.http
      .get<MovimientoInsumoListadoDTO[]>(`${BASE_URL}/ObtenerCombo`)
      .pipe(catchError(this.manejarError));
  }

  // ── GET /ObtenerListadoPorId ───────────────────────────────────────────────
  obtenerPorId(id: number): Observable<MovimientoInsumoDetalleDTO> {
    const params = new HttpParams().set('id', id.toString());
    return this.http
      .get<MovimientoInsumoDetalleDTO>(`${BASE_URL}/ObtenerListadoPorId`, { params })
      .pipe(catchError(this.manejarError));
  }

  // ── GET /ObtenerInsumoLote ─────────────────────────────────────────────────
  obtenerInsumoLote(): Observable<InsumoLoteListadoDTO[]> {
    return this.http
      .get<InsumoLoteListadoDTO[]>(`${BASE_URL}/ObtenerInsumoLote`)
      .pipe(catchError(this.manejarError));
  }

  // ── GET TipoMovimiento/ObtenerCombo ───────────────────────────────────────
  obtenerTiposMovimiento(): Observable<any[]> {
    return this.http
      .get<any[]>(`${TIPO_MOV_URL}/ObtenerCombo`)
      .pipe(catchError(this.manejarError));
  }

  // ── POST /Insertar ─────────────────────────────────────────────────────────
  insertar(datos: {
    idTipoMovimiento: number;
    idInsumoLote: number;
    cantidad: number;
    fechaMovimiento: string;
    referencia: string | null;
  }): Observable<any> {
    const now = new Date().toISOString();
    const payload: MovimientoInsumoRequestDTO = {
      id: 0,
      activo: true,
      usuarioCreacion: USUARIO,
      usuarioModificacion: USUARIO,
      fechaCreacion: now,
      fechaModificacion: now,
      idTipoMovimiento: datos.idTipoMovimiento,
      idInsumoLote: datos.idInsumoLote,
      cantidad: datos.cantidad,
      fechaMovimiento: datos.fechaMovimiento,
      referencia: datos.referencia || null,
    };
    return this.http
      .post<any>(`${BASE_URL}/Insertar`, payload)
      .pipe(catchError(this.manejarError));
  }

  // ── PUT /Modificar ─────────────────────────────────────────────────────────
  modificar(
    id: number,
    datos: {
      idTipoMovimiento: number;
      idInsumoLote: number;
      cantidad: number;
      fechaMovimiento: string;
      referencia: string | null;
    },
    detalle: MovimientoInsumoDetalleDTO
  ): Observable<any> {
    const payload: MovimientoInsumoRequestDTO = {
      id,
      activo: detalle.activo,
      usuarioCreacion: detalle.usuarioCreacion,
      usuarioModificacion: USUARIO,
      fechaCreacion: detalle.fechaCreacion,
      fechaModificacion: new Date().toISOString(),
      idTipoMovimiento: datos.idTipoMovimiento,
      idInsumoLote: datos.idInsumoLote,
      cantidad: datos.cantidad,
      fechaMovimiento: datos.fechaMovimiento,
      referencia: datos.referencia || null,
    };
    return this.http
      .put<any>(`${BASE_URL}/Modificar`, payload)
      .pipe(catchError(this.manejarError));
  }

  // ── Error handler ──────────────────────────────────────────────────────────
  private manejarError(error: any): Observable<never> {
    let mensaje = 'Ocurrió un error inesperado. Intenta de nuevo.';
    if (error.status === 0)        mensaje = 'No se puede conectar al servidor.';
    else if (error.status === 400) mensaje = error.error?.message ?? 'Datos inválidos.';
    else if (error.status === 404) mensaje = 'El recurso solicitado no existe.';
    else if (error.status === 409) mensaje = 'Conflicto en los datos enviados.';
    else if (error.status >= 500)  mensaje = 'Error del servidor. Contacta al administrador.';
    console.error('[MovimientoInsumoService]', error);
    return throwError(() => new Error(mensaje));
  }
}
