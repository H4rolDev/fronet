/**
 * @file proveedor.service.ts
 * @description Servicio HTTP para el módulo de Proveedores.
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ProveedorListadoDTO, ProveedorRequestDTO } from '../models/entrada-insumo-dto';
import { environment } from '../environments/environment';

const BASE = `${environment.apiUrl}/Proveedor`;

@Injectable({ providedIn: 'root' })
export class ProveedorService {

  constructor(public http: HttpClient) {}

  private err(e: any): Observable<never> {
    console.error('Error en ProveedorService:', e);
    throw e;
  }

  obtenerListado(): Observable<ProveedorListadoDTO[]> {
    return this.http.get<ProveedorListadoDTO[]>(`${BASE}/ObtenerCombo`)
      .pipe(catchError(this.err));
  }

  obtenerPorId(id: number): Observable<ProveedorListadoDTO> {
    const params = new HttpParams().set('id', id);
    return this.http.get<ProveedorListadoDTO>(`${BASE}/ObtenerListadoPorId`, { params })
      .pipe(catchError(this.err));
  }

  crear(data: ProveedorRequestDTO): Observable<any> {
    return this.http.post(BASE, data).pipe(catchError(this.err));
  }

  actualizar(data: ProveedorRequestDTO): Observable<any> {
    return this.http.put(BASE, data).pipe(catchError(this.err));
  }

  desactivar(id: number): Observable<any> {
    return this.http.put(`${BASE}/Desactivar/${id}`, {}).pipe(catchError(this.err));
  }

  activar(id: number): Observable<any> {
    return this.http.put(`${BASE}/Activar/${id}`, {}).pipe(catchError(this.err));
  }
}