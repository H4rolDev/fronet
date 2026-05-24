import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  EntradaInsumoListadoDTO,
  EntradaInsumoRequestDTO,
  EntradaInsumoAprobarDTO,
  EntradaInsumoRechazarDTO,
  ProveedorListadoDTO,
  ProveedorRequestDTO
} from '../models/entrada-insumo-dto';
import { environment } from '../environments/environment';

const BASE_URL = `${environment.apiUrl}/EntradaInsumo`;
const PROVEEDOR_URL = `${environment.apiUrl}/Proveedor`;

@Injectable({ providedIn: 'root' })
export class EntradaInsumoService {
  constructor(private http: HttpClient) {}

  registrar(dto: EntradaInsumoRequestDTO): Observable<number> {
    return this.http.post<number>(`${BASE_URL}/Registrar`, dto);
  }

  obtenerPendientes(): Observable<EntradaInsumoListadoDTO[]> {
    return this.http.get<EntradaInsumoListadoDTO[]>(`${BASE_URL}/ObtenerPendientes`);
  }

  obtenerPorId(id: number): Observable<EntradaInsumoListadoDTO> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<EntradaInsumoListadoDTO>(`${BASE_URL}/ObtenerPorId`, { params });
  }

  aprobar(dto: EntradaInsumoAprobarDTO): Observable<boolean> {
    return this.http.put<boolean>(`${BASE_URL}/Aprobar`, dto);
  }

  rechazar(dto: EntradaInsumoRechazarDTO): Observable<boolean> {
    return this.http.put<boolean>(`${BASE_URL}/Rechazar`, dto);
  }

  obtenerTodos(filtro?: any): Observable<any> {
    let params = new HttpParams();
    if (filtro) {
      if (filtro.idEstado) params = params.set('idEstado', filtro.idEstado.toString());
      if (filtro.idProveedor) params = params.set('idProveedor', filtro.idProveedor.toString());
      if (filtro.fechaInicio) params = params.set('fechaInicio', filtro.fechaInicio);
      if (filtro.fechaFin) params = params.set('fechaFin', filtro.fechaFin);
      if (filtro.pagina) params = params.set('pagina', filtro.pagina.toString());
      if (filtro.tamanioPagina) params = params.set('tamanioPagina', filtro.tamanioPagina.toString());
    }
    return this.http.get<any>(`${BASE_URL}/ObtenerTodos`, { params });
  }

  obtenerHistorial(idEntrada: number): Observable<any[]> {
    const params = new HttpParams().set('id', idEntrada.toString());
    return this.http.get<any[]>(`${BASE_URL}/ObtenerHistorial`, { params });
  }
}

@Injectable({ providedIn: 'root' })
export class ProveedorService {
  constructor(private http: HttpClient) {}

  obtenerListado(): Observable<ProveedorListadoDTO[]> {
    return this.http.get<ProveedorListadoDTO[]>(`${PROVEEDOR_URL}/ObtenerCombo`);
  }

  obtenerPorId(id: number): Observable<ProveedorListadoDTO> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<ProveedorListadoDTO>(`${PROVEEDOR_URL}/ObtenerListadoPorId`, { params });
  }

  insertar(dto: ProveedorRequestDTO): Observable<number> {
    return this.http.post<number>(`${PROVEEDOR_URL}/Insertar`, dto);
  }

  modificar(dto: ProveedorRequestDTO): Observable<boolean> {
    return this.http.put<boolean>(`${PROVEEDOR_URL}/Modificar`, dto);
  }

  eliminar(id: number, usuario: string): Observable<boolean> {
    return this.http.delete<boolean>(`${PROVEEDOR_URL}/Eliminar`, { params: { id: id.toString(), usuario } });
  }
}