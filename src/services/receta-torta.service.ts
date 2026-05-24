/**
 * @file receta-torta.service.ts
 * @description Servicio HTTP para el módulo de Recetas de Torta.
 *
 * Notas importantes sobre el contrato de la API:
 * - POST InsertarMultipleTabla  → crea la receta completa de una torta
 * - PUT  ActualizarMultipleTabla → REEMPLAZA la receta completa (todos los detalles)
 * - DELETE Eliminar              → elimina una fila individual por su ID de fila
 * - No existe eliminar-por-torta: para eliminar una receta entera se deben
 *   eliminar todas sus filas individualmente.
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RecetaTortaDetalleDTO, RecetaTortaListadoDTO, RecetaTortaRequestDTO } from '../models/receta-torta-dto';
import { environment } from '../environments/environment';


const BASE_URL = `${environment.apiUrl}/RecetaTorta`;
const USUARIO  = 'admin'; // reemplazar con AuthService

@Injectable({ providedIn: 'root' })
export class RecetaTortaService {

  constructor(private http: HttpClient) {}

  // ── GET /ObtenerCombo ──────────────────────────────────────────────────────
  /**
   * Retorna todas las filas de todas las recetas.
   * El componente las agrupa por idTorta para mostrarlas como cards.
   */
  obtenerListado(): Observable<RecetaTortaListadoDTO[]> {
    return this.http
      .get<RecetaTortaListadoDTO[]>(`${BASE_URL}/ObtenerCombo`)
      .pipe(catchError(this.manejarError));
  }

  // ── GET /ObtenerListadoPorId ───────────────────────────────────────────────
  /**
   * Obtiene el detalle de una fila de receta por su ID de fila.
   *
   * @param id - ID de la fila (no de la torta)
   */
  obtenerPorId(id: number): Observable<RecetaTortaDetalleDTO> {
    const params = new HttpParams().set('id', id.toString());
    return this.http
      .get<RecetaTortaDetalleDTO>(`${BASE_URL}/ObtenerListadoPorId`, { params })
      .pipe(catchError(this.manejarError));
  }

  // ── POST /InsertarMultipleTabla ────────────────────────────────────────────
  /**
   * Crea la receta completa de una torta de una sola vez.
   * Envía todos los insumos en el array detalles[].
   *
   * @param idTorta   - ID de la torta
   * @param detalles  - Lista de insumos con cantidades
   */
  insertar(
    idTorta: number,
    detalles: { idInsumo: number; cantidadRequerida: number }[]
  ): Observable<any> {
    const payload: RecetaTortaRequestDTO = {
      usuarioCreacion: USUARIO,
      idTorta,
      detalles,
    };

    return this.http
      .post<any>(`${BASE_URL}/InsertarMultipleTabla`, payload)
      .pipe(catchError(this.manejarError));
  }

  // ── PUT /ActualizarMultipleTabla ───────────────────────────────────────────
  /**
   * Actualiza (reemplaza) la receta completa de una torta.
   * Envía TODOS los insumos vigentes; el backend descarta los anteriores.
   *
   * @param idTorta   - ID de la torta
   * @param detalles  - Lista actualizada de insumos con cantidades
   */
  actualizar(
    idTorta: number,
    detalles: { idInsumo: number; cantidadRequerida: number }[]
  ): Observable<any> {
    const payload: RecetaTortaRequestDTO = {
      usuarioCreacion: USUARIO,
      idTorta,
      detalles,
    };

    return this.http
      .put<any>(`${BASE_URL}/ActualizarMultipleTabla`, payload)
      .pipe(catchError(this.manejarError));
  }

  // ── DELETE /Eliminar ───────────────────────────────────────────────────────
  /**
   * Elimina una fila individual de receta por su ID de fila.
   * Para eliminar una receta completa, llamar una vez por cada fila.
   *
   * @param id - ID de la fila a eliminar
   */
  eliminarFila(id: number): Observable<any> {
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

    if (error.status === 0)        mensaje = 'No se puede conectar al servidor.';
    else if (error.status === 400) mensaje = error.error?.message ?? 'Datos inválidos.';
    else if (error.status === 404) mensaje = 'Registro no encontrado.';
    else if (error.status === 409) mensaje = 'Ya existe una receta para esa torta.';
    else if (error.status >= 500)  mensaje = 'Error del servidor. Contacta al administrador.';

    console.error('[RecetaTortaService]', error);
    return throwError(() => new Error(mensaje));
  }
}
