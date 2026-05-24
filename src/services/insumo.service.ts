/**
 * @file insumo.service.ts
 * @description Servicio HTTP para el módulo de Insumos.
 *
 * Cubre los 9 endpoints del módulo:
 *  1. GET  ObtenerCombo              → listado principal (1 fila por insumo)
 *  2. GET  ObtenerListadoPorId       → detalle insumo para editar
 *  3. GET  ObtenerLotesPorInsumo     → lotes de un insumo para modal detalle
 *  4. POST InsertarMultipleTabla     → crear insumo + primer lote
 *  5. PUT  ActualizarLoteInsumo      → editar lote (cantidades, costo, venc.)
 *  6. PUT  DesactivarLoteInsumo      → desactivar lote (solo si stock = 0)
 *  7. PUT  DesactivarInsumo          → desactivar insumo (solo si stock = 0)
 *  8. PUT  ActivarInsumo             → reactivar insumo
 *  9. PUT  ActivarLoteInsumo         → reactivar lote (requiere insumo activo + no vencido)
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import {
  InsumoListadoDTO,
  InsumoDetalleDTO,
  InsumoLoteDTO,
  InsertarLoteInsumoDTO,
  ActualizarLoteInsumoDTO,
} from '../models/insumo-dto';
import { environment } from '../environments/environment';

const BASE = `${environment.apiUrl}/Insumo`;
const USR  = 'admin'; // reemplazar con AuthService

@Injectable({ providedIn: 'root' })
export class InsumoService {

  constructor(public http: HttpClient) {}

  // ── 1. Listado principal ───────────────────────────────────────────────────
  obtenerListado(): Observable<InsumoListadoDTO[]> {
    return this.http.get<InsumoListadoDTO[]>(`${BASE}/ObtenerCombo`)
      .pipe(catchError(this.err));
  }

  // ── 2. Detalle insumo por ID ───────────────────────────────────────────────
  obtenerPorId(id: number): Observable<InsumoDetalleDTO> {
    const params = new HttpParams().set('id', id);
    return this.http.get<InsumoDetalleDTO>(`${BASE}/ObtenerListadoPorId`, { params })
      .pipe(catchError(this.err));
  }

  // ── 3. Lotes de un insumo ─────────────────────────────────────────────────
  obtenerLotesPorInsumo(idInsumo: number): Observable<InsumoLoteDTO[]> {
    const params = new HttpParams().set('idInsumo', idInsumo);
    return this.http.get<InsumoLoteDTO[]>(`${BASE}/ObtenerLotesPorInsumo`, { params })
      .pipe(catchError(this.err));
  }

  // ── 4. Crear insumo + primer lote ─────────────────────────────────────────
  /**
   * @param idInsumo  0 = crear insumo nuevo; >0 = usar insumo existente
   * @param nombre    solo si idInsumo = 0
   * @param idUnidad  solo si idInsumo = 0
   */
  insertarLote(datos: {
    idInsumo: number;
    nombre: string;
    idUnidadMedida: number;
    cantidadInicial: number;
    cantidadDisponible: number;
    costoUnitario: number;
    fechaVencimiento: string | null;
  }): Observable<number> {
    const payload: InsertarLoteInsumoDTO = {
      idInsumo:           datos.idInsumo,
      nombre:             datos.nombre?.trim() ?? '',
      idUnidadMedida:     datos.idUnidadMedida,
      idLote:             0,
      numeroLote:         '',
      cantidadInicial:    datos.cantidadInicial,
      cantidadDisponible: datos.cantidadDisponible,
      costoUnitario:      datos.costoUnitario,
      fechaVencimiento:   datos.fechaVencimiento,
      usuario:            USR,
    };
    return this.http.post<number>(`${BASE}/InsertarMultipleTabla`, payload)
      .pipe(catchError(this.err));
  }

  // ── 5. Actualizar lote ────────────────────────────────────────────────────
  /**
   * Solo modifica: cantidadInicial, cantidadDisponible, costoUnitario, fechaVencimiento.
   * El backend registra un movimiento si cambia cantidadDisponible.
   */
  actualizarLote(
    lote: InsumoLoteDTO,
    cambios: {
      cantidadInicial: number;
      cantidadDisponible: number;
      costoUnitario: number;
      fechaVencimiento: string | null;
    }
  ): Observable<boolean> {
    const payload: ActualizarLoteInsumoDTO = {
      idLote:             lote.id,
      idInsumo:           lote.idInsumo,
      nombre:             '',          // no relevante en actualización
      idUnidadMedida:     0,
      numeroLote:         lote.numeroLote,
      cantidadInicial:    cambios.cantidadInicial,
      cantidadDisponible: cambios.cantidadDisponible,
      costoUnitario:      cambios.costoUnitario,
      fechaVencimiento:   cambios.fechaVencimiento,
      usuario:            USR,
    };
    return this.http.put<boolean>(`${BASE}/ActualizarLoteInsumo`, payload)
      .pipe(catchError(this.err));
  }

  // ── 6. Actualizar insumo (nombre / unidad) ─────────────────────────────────
  /**
   * Ajustar endpoint según tu API real de edición de insumo.
   */
  actualizarInsumo(id: number, nombre: string, idUnidadMedida: number, date: string): Observable<any> {
    return this.http.put<any>(`${BASE}/Modificar`, {
      id, nombre: nombre.trim(), idUnidadMedida, usuarioCreacion: USR, fechaCreacion: date,
    }).pipe(catchError(this.err));
  }

  // ── 7. Desactivar insumo ──────────────────────────────────────────────────
  /** El backend valida que stockDisponible === 0. Si no, lanza 400. */
  desactivarInsumo(id: number): Observable<any> {
    const params = new HttpParams().set('id', id).set('usuario', USR);
    return this.http.put<any>(`${BASE}/DesactivarInsumo`, null, { params })
      .pipe(catchError(this.err));
  }

  // ── 8. Desactivar lote ────────────────────────────────────────────────────
  /** El backend valida que cantidadDisponible === 0. Si no, lanza 400. */
  desactivarLote(idLote: number): Observable<any> {
    const params = new HttpParams().set('id', idLote).set('usuario', USR);
    return this.http.put<any>(`${BASE}/DesactivarLoteInsumo`, null, { params })
      .pipe(catchError(this.err));
  }

  // ── 9. Activar insumo ─────────────────────────────────────────────────────
  activarInsumo(id: number): Observable<any> {
    const params = new HttpParams().set('id', id).set('usuario', USR);
    return this.http.put<any>(`${BASE}/ActivarInsumo`, null, { params })
      .pipe(catchError(this.err));
  }

  // ── 10. Activar lote ──────────────────────────────────────────────────────
  /** El backend valida que insumo esté activo y lote no esté vencido. */
  activarLote(idLote: number): Observable<any> {
    const params = new HttpParams().set('id', idLote).set('usuario', USR);
    return this.http.put<any>(`${BASE}/ActivarLoteInsumo`, null, { params })
      .pipe(catchError(this.err));
  }

  // ── Error handler ──────────────────────────────────────────────────────────
  private err(error: any): Observable<never> {
    let msg = 'Ocurrió un error inesperado.';
    if (error.status === 0)        msg = 'No se puede conectar al servidor.';
    else if (error.status === 400) msg = error.error?.message ?? error.error ?? 'Solicitud inválida.';
    else if (error.status === 404) msg = 'Registro no encontrado.';
    else if (error.status === 409) msg = error.error?.message ?? 'Conflicto de datos.';
    else if (error.status >= 500)  msg = 'Error del servidor. Contacta al administrador.';
    console.error('[InsumoService]', error);
    return throwError(() => new Error(msg));
  }
}
