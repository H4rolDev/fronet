/**
 * @file produccion.service.ts
 * @description Servicio HTTP para el módulo de Producción de Tortas.
 *
 * Endpoints cubiertos:
 *  1. GET  Produccion/ObtenerListadoProduccion        → listado principal
 *  2. GET  Produccion/ObtenerListadoPorId?id=X        → header detalle
 *  3. GET  Produccion/ObtenerDetallePorProduccion?id  → insumos usados
 *  4. GET  Torta/ObtenerListadoPorId?id=X             → info de torta
 *  5. GET  Torta/ObtenerCombo                         → combo de tortas
 *  6. GET  CategoriaTorta/ObtenerListadoPorId?id=X    → categoría
 *  7. GET  RecetaTorta/ObtenerCombo                   → receta de torta
 *  8. GET  Insumo/ObtenerCombo                        → combo de insumos
 *  9. POST Produccion/InsertarProduccion              → crear producción
 * 10. POST Produccion/AjustarInsumo                   → ajuste de insumo
 * 11. POST Produccion/AjustarTorta                    → ajuste de torta
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../environments/environment';

import {
  ProduccionCabeceraDTO,
  ProduccionDetalleHeaderDTO,
  ProduccionDetalleInsumoDTO,
  TortaDetalleDTO,
  TortaComboDTO,
  CategoriaTortaDTO,
  RecetaTortaItemDTO,
  InsumoComboDTO,
  InsertarProduccionDTO,
  AjusteInsumoDTO,
  AjusteTortaDTO,
} from '../models/produccion-dto';

const BASE    = environment.apiUrl;
const USUARIO = 'admin'; // reemplazar con AuthService

@Injectable({ providedIn: 'root' })
export class ProduccionService {

  constructor(private http: HttpClient) {}

  obtenerListado(): Observable<ProduccionCabeceraDTO[]> {
    return this.http
      .get<ProduccionCabeceraDTO[]>(`${BASE}/Produccion/ObtenerProducciones`)
      .pipe(catchError(this.err));
  }

  obtenerPorId(id: number): Observable<ProduccionDetalleHeaderDTO> {
    const params = new HttpParams().set('id', id);
    return this.http
      .get<ProduccionDetalleHeaderDTO>(`${BASE}/Produccion/ObtenerListadoPorId`, { params })
      .pipe(catchError(this.err));
  }

  obtenerDetalle(id: number): Observable<ProduccionDetalleInsumoDTO[]> {
    const params = new HttpParams().set('id', id);
    return this.http
      .get<ProduccionDetalleInsumoDTO[]>(`${BASE}/Produccion/ObtenerDetalleProduccion`, { params })
      .pipe(catchError(this.err));
  }

  obtenerTortaPorId(id: number): Observable<TortaDetalleDTO> {
    const params = new HttpParams().set('id', id);
    return this.http
      .get<TortaDetalleDTO>(`${BASE}/Torta/ObtenerListadoPorId`, { params })
      .pipe(catchError(this.err));
  }

  obtenerComboTortas(): Observable<TortaComboDTO[]> {
    return this.http
      .get<TortaComboDTO[]>(`${BASE}/Torta/ObtenerCombo`)
      .pipe(catchError(this.err));
  }

  obtenerCategoria(id: number): Observable<CategoriaTortaDTO> {
    const params = new HttpParams().set('id', id);
    return this.http
      .get<CategoriaTortaDTO>(`${BASE}/CategoriaTorta/ObtenerListadoPorId`, { params })
      .pipe(catchError(this.err));
  }

  obtenerRecetaPorTorta(idTorta: number): Observable<RecetaTortaItemDTO[]> {
    return this.http
      .get<any[]>(`${BASE}/RecetaTorta/ObtenerCombo`)
      .pipe(
        map(rows =>
          rows
            .filter(r => r.idTorta === idTorta)
            .map(r => ({
              idInsumo:          r.idInsumo,
              nombreInsumo:      r.nombreInsumo,
              cantidadRequerida: r.cantidadRequerida,
              unidadMedida:      r.abreviatura ?? '',
            }))
        ),
        catchError(this.err)
      );
  }

  obtenerComboInsumos(): Observable<InsumoComboDTO[]> {
    return this.http
      .get<InsumoComboDTO[]>(`${BASE}/Insumo/ObtenerCombo`)
      .pipe(catchError(this.err));
  }

  insertarProduccion(datos: {
    idTorta: number;
    cantidadProducida: number;
    observacion: string | null;
  }): Observable<number> {
    const payload: any = {
      IdTorta:           datos.idTorta,
      CantidadProducida: datos.cantidadProducida,
      Observacion:       datos.observacion?.trim() || null,
      UsuarioCreacion:   USUARIO,
    };
    return this.http
      .post<number>(`${BASE}/Produccion/InsertarMultipleTabla`, payload)
      .pipe(catchError(this.err));
  }

  ajustarInsumo(datos: {
    idInsumo: number;
    cantidad: number;
    esEntrada: boolean;
    observacion: string | null;
  }): Observable<boolean> {
    const payload: AjusteInsumoDTO = {
      idInsumo:     datos.idInsumo,
      cantidad:     datos.cantidad,
      esEntrada:    datos.esEntrada,
      usuario:      USUARIO,
      observacion:  datos.observacion?.trim() || null,
    };
    return this.http
      .post<boolean>(`${BASE}/Produccion/AjustarInsumo`, payload)
      .pipe(catchError(this.err));
  }

  ajustarTorta(datos: {
    idTorta: number;
    cantidad: number;
    esEntrada: boolean;
    observacion: string | null;
  }): Observable<boolean> {
    const payload: AjusteTortaDTO = {
      idTorta:     datos.idTorta,
      cantidad:    datos.cantidad,
      esEntrada:   datos.esEntrada,
      usuario:     USUARIO,
      observacion: datos.observacion?.trim() || null,
    };
    return this.http
      .post<boolean>(`${BASE}/Produccion/AjustarTorta`, payload)
      .pipe(catchError(this.err));
  }

  private err(error: any): Observable<never> {
    let msg = 'Ocurrió un error inesperado.';
    if (error.status === 0)        msg = 'No se puede conectar al servidor.';
    else if (error.status === 400) msg = error.error?.message ?? error.error ?? 'Solicitud inválida.';
    else if (error.status === 404) msg = 'Recurso no encontrado.';
    else if (error.status >= 500)  msg = 'Error del servidor. Contacta al administrador.';
    console.error('[ProduccionService]', error);
    return throwError(() => new Error(msg));
  }
}
