/**
 * @file movimiento-torta.service.ts
 * @description Servicio que encapsula TODAS las llamadas HTTP al API de MovimientoTorta.
 * No tiene endpoint de eliminación por diseño del negocio.
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  MovimientoTortaListadoDTO,
  MovimientoTortaDetalleDTO,
  MovimientoTortaRequestDTO,
  TortaComboDTO,
  TipoMovimientoDTO,
} from '../models/movimiento-torta-dto';
import { environment } from '../environments/environment';

const BASE_URL     = `${environment.apiUrl}/MovimientoTorta`;
const TORTA_URL    = `${environment.apiUrl}/Torta`;
const TIPO_MOV_URL = `${environment.apiUrl}/TipoMovimiento`;
const USUARIO      = 'admin'; // reemplazar con tu AuthService

@Injectable({ providedIn: 'root' })
export class MovimientoTortaService {

  constructor(private http: HttpClient) {}

  // ── GET /ObtenerCombo ──────────────────────────────────────────────────────
  obtenerListado(): Observable<MovimientoTortaListadoDTO[]> {
    return this.http
      .get<MovimientoTortaListadoDTO[]>(`${BASE_URL}/ObtenerCombo`)
      .pipe(catchError(this.manejarError));
  }

  // ── GET /ObtenerListadoPorId ───────────────────────────────────────────────
  obtenerPorId(id: number): Observable<MovimientoTortaDetalleDTO> {
    const params = new HttpParams().set('id', id.toString());
    return this.http
      .get<MovimientoTortaDetalleDTO>(`${BASE_URL}/ObtenerListadoPorId`, { params })
      .pipe(catchError(this.manejarError));
  }

  // ── GET Torta/ObtenerCombo ─────────────────────────────────────────────────
  obtenerTortas(): Observable<TortaComboDTO[]> {
    return this.http
      .get<TortaComboDTO[]>(`${TORTA_URL}/ObtenerCombo`)
      .pipe(catchError(this.manejarError));
  }

  // ── GET TipoMovimiento/ObtenerCombo ───────────────────────────────────────
  obtenerTiposMovimiento(): Observable<TipoMovimientoDTO[]> {
    return this.http
      .get<TipoMovimientoDTO[]>(`${TIPO_MOV_URL}/ObtenerCombo`)
      .pipe(catchError(this.manejarError));
  }

  // ── POST /Insertar ─────────────────────────────────────────────────────────
  insertar(datos: {
    idTipoMovimiento: number;
    idTorta: number;
    cantidad: number;
    fechaMovimiento: string;
    referencia: string | null;
  }): Observable<any> {
    const now = new Date().toISOString();
    const payload: MovimientoTortaRequestDTO = {
      id: 0,
      activo: true,
      usuarioCreacion: USUARIO,
      usuarioModificacion: USUARIO,
      fechaCreacion: now,
      fechaModificacion: now,
      idTipoMovimiento: datos.idTipoMovimiento,
      idTorta: datos.idTorta,
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
      idTorta: number;
      cantidad: number;
      fechaMovimiento: string;
      referencia: string | null;
    },
    detalle: MovimientoTortaDetalleDTO
  ): Observable<any> {
    const payload: MovimientoTortaRequestDTO = {
      id,
      activo: detalle.activo,
      usuarioCreacion: detalle.usuarioCreacion,
      usuarioModificacion: USUARIO,
      fechaCreacion: detalle.fechaCreacion,
      fechaModificacion: new Date().toISOString(),
      idTipoMovimiento: datos.idTipoMovimiento,
      idTorta: datos.idTorta,
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
    console.error('[MovimientoTortaService]', error);
    return throwError(() => new Error(mensaje));
  }
}
