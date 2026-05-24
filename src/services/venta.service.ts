/**
 * @file venta.service.ts
 * @description Servicio HTTP para el módulo de Ventas de Tortas.
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import {
  VentaListadoDTO,
  VentaDetalleDTO,
  ComprobanteDTO,
  RegistrarVentaDTO,
  TortaVentaDTO,
  PersonaComboDTO,
  MetodoPagoDTO,
  TipoComprobanteDTO,
  RepartidorDTO,
} from '../models/venta-dto';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

const BASE    = environment.apiUrl;
const USUARIO = 'admin';

@Injectable({ providedIn: 'root' })
export class VentaService {

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    if (token) {
      return new HttpHeaders({ Authorization: `Bearer ${token}` });
    }
    return new HttpHeaders();
  }

  // ── 1. Registrar venta ─────────────────────────────────────────────────────
  registrar(dto: RegistrarVentaDTO): Observable<number> {
    return this.http
      .post<number>(`${BASE}/Venta/Registrar`, dto, { headers: this.getHeaders() })
      .pipe(catchError(this.err));
  }

  // ── 2. Listado de ventas ───────────────────────────────────────────────────
  obtenerListado(): Observable<VentaListadoDTO[]> {
    return this.http
      .get<VentaListadoDTO[]>(`${BASE}/Venta/Listado`)
      .pipe(catchError(this.err));
  }

  // ── 3. Detalle de venta ────────────────────────────────────────────────────
  obtenerDetalle(idVenta: number): Observable<VentaDetalleDTO> {
    const params = new HttpParams().set('idVenta', idVenta);
    return this.http
      .get<VentaDetalleDTO>(`${BASE}/Venta/Detalle`, { params })
      .pipe(catchError(this.err));
  }

  // ── 4. Comprobante para impresión ──────────────────────────────────────────
  obtenerComprobante(idVenta: number): Observable<ComprobanteDTO> {
    const params = new HttpParams().set('idVenta', idVenta);
    return this.http
      .get<ComprobanteDTO>(`${BASE}/Venta/Comprobante`, { params })
      .pipe(catchError(this.err));
  }

  // ── 5. Cancelar venta ──────────────────────────────────────────────────────
  cancelar(idVenta: number, motivo: string): Observable<any> {
    const params = new HttpParams()
      .set('idVenta', idVenta)
      .set('motivo', motivo)
      .set('usuario', USUARIO);
    return this.http
      .put<any>(`${BASE}/Venta/Cancelar`, null, { params })
      .pipe(catchError(this.err));
  }

  // ── 6. Combo de tortas ─────────────────────────────────────────────────────
  obtenerTortas(): Observable<TortaVentaDTO[]> {
    return this.http
      .get<TortaVentaDTO[]>(`${BASE}/Torta/ObtenerCombo`)
      .pipe(catchError(this.err));
  }

  // ── 7. Combo de clientes (solo rol 3) ─────────────────────────────────────
  obtenerClientes(): Observable<PersonaComboDTO[]> {
    return this.http
      .get<PersonaComboDTO[]>(`${BASE}/Venta/ComboClientes`)
      .pipe(catchError(this.err));
  }

  // ── 8. Métodos de pago ─────────────────────────────────────────────────────
  obtenerMetodosPago(): Observable<MetodoPagoDTO[]> {
    return this.http
      .get<MetodoPagoDTO[]>(`${BASE}/Venta/ObtenerComboMetodoPago`)
      .pipe(catchError(this.err));
  }

  // ── 9. Tipos de comprobante ────────────────────────────────────────────────
  obtenerTiposComprobante(): Observable<TipoComprobanteDTO[]> {
    return this.http
      .get<TipoComprobanteDTO[]>(`${BASE}/Venta/ObtenerComboTipoComprobante`)
      .pipe(catchError(this.err));
  }

  // ── 10. Repartidores (solo rol 4) ──────────────────────────────────────────
  obtenerRepartidores(): Observable<RepartidorDTO[]> {
    return this.http
      .get<RepartidorDTO[]>(`${BASE}/Venta/ComboDrivers`)
      .pipe(catchError(this.err));
  }

  // ── 11. Listado de Deliveries ──────────────────────────────────────────────
  obtenerListadoDeliveries(): Observable<any[]> {
    return this.http
      .get<any[]>(`${BASE}/Venta/ListadoDeliveries`)
      .pipe(catchError(this.err));
  }

  // ── 12. Actualizar estado de delivery ──────────────────────────────────────
  actualizarEstadoDelivery(idDelivery: number, idEstadoEntrega: number): Observable<any> {
    const params = new HttpParams()
      .set('idDelivery', idDelivery.toString())
      .set('idEstadoEntrega', idEstadoEntrega.toString())
      .set('usuario', 'admin');
    return this.http.put(`${BASE}/Venta/ActualizarEstadoDelivery`, null, { params })
      .pipe(catchError(this.err));
  }

  // ── 13. Asignar repartidor ─────────────────────────────────────────────────
  asignarRepartidor(idDelivery: number, idPersonalRepartidor: number): Observable<any> {
    const params = new HttpParams()
      .set('idDelivery', idDelivery.toString())
      .set('idPersonalRepartidor', idPersonalRepartidor.toString())
      .set('usuario', 'admin');
    return this.http.put(`${BASE}/Venta/AsignarRepartidor`, null, { params })
      .pipe(catchError(this.err));
  }

  // ── 14. Cancelar entrega ──────────────────────────────────────────────────
  cancelarEntrega(idDelivery: number, motivo: string): Observable<any> {
    const params = new HttpParams()
      .set('idDelivery', idDelivery.toString())
      .set('motivo', motivo)
      .set('usuario', 'admin');
    return this.http.put(`${BASE}/Venta/CancelarEntrega`, null, { params })
      .pipe(catchError(this.err));
  }

  // ── 15. Combo drivers ──────────────────────────────────────────────────────
obtenerComboDrivers(): Observable<RepartidorDTO[]> {
    return this.http
      .get<RepartidorDTO[]>(`${BASE}/Personal/ObtenerComboDrivers`)
      .pipe(catchError(this.err));
  }

  obtenerComboEstadoEntrega(): Observable<any[]> {
    return this.http
      .get<any[]>(`${BASE}/EntregaDelivery/ObtenerCombo`)
      .pipe(catchError(this.err));
  }

  // ── Validación de Pagos ─────────────────────────────────────────────────────
  obtenerPendientesValidacion(): Observable<any[]> {
    return this.http
      .get<any[]>(`${BASE}/Venta/ObtenerPendientesValidacion`, { headers: this.getHeaders() })
      .pipe(catchError(this.err));
  }

  aprobarVenta(idVenta: number, usuario: string): Observable<any> {
    return this.http
      .post<any>(`${BASE}/Venta/AprobarVenta`, { idVenta, usuario }, { headers: this.getHeaders() })
      .pipe(catchError(this.err));
  }

  rechazarVenta(idVenta: number, motivoRechazo: string, usuario: string): Observable<any> {
    return this.http
      .post<any>(`${BASE}/Venta/RechazarVenta`, { idVenta, motivoRechazo, usuario }, { headers: this.getHeaders() })
      .pipe(catchError(this.err));
  }

  obtenerTodos(filtro?: any): Observable<any> {
    let params = new HttpParams();
    if (filtro) {
      if (filtro.idEstado) params = params.set('idEstado', filtro.idEstado.toString());
      if (filtro.idPersona) params = params.set('idPersona', filtro.idPersona.toString());
      if (filtro.fechaInicio) params = params.set('fechaInicio', filtro.fechaInicio);
      if (filtro.fechaFin) params = params.set('fechaFin', filtro.fechaFin);
      if (filtro.numeroOperacion) params = params.set('numeroOperacion', filtro.numeroOperacion);
      if (filtro.pagina) params = params.set('pagina', filtro.pagina.toString());
      if (filtro.tamanioPagina) params = params.set('tamanioPagina', filtro.tamanioPagina.toString());
    }
    return this.http.get<any>(`${BASE}/Venta/ObtenerTodos`, { params, headers: this.getHeaders() })
      .pipe(catchError(this.err));
  }

  obtenerHistorial(idVenta: number): Observable<any[]> {
    const params = new HttpParams().set('id', idVenta.toString());
    return this.http.get<any[]>(`${BASE}/Venta/ObtenerHistorial`, { params, headers: this.getHeaders() })
      .pipe(catchError(this.err));
  }

  private err(error: any): Observable<never> {
    let msg = 'Ocurrió un error inesperado.';
    if (error.status === 0)        msg = 'No se puede conectar al servidor.';
    else if (error.status === 400) msg = error.error?.message ?? error.error ?? 'Solicitud inválida.';
    else if (error.status === 404) msg = 'Recurso no encontrado.';
    else if (error.status === 409) msg = error.error?.message ?? 'Conflicto de datos.';
    else if (error.status >= 500)  msg = 'Error del servidor. Contacta al administrador.';
    console.error('[VentaService]', error);
    return throwError(() => new Error(msg));
  }
}