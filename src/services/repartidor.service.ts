import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

const BASE = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class RepartidorService {
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

  obtenerMisPedidos(idPersona: number): Observable<any> {
    const params = new HttpParams().set('idPersona', idPersona.toString());
    return this.http.get<any>(`${BASE}/Venta/MisPedidosRepartidor`, { 
      params,
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  aceptarPedido(idDelivery: number): Observable<any> {
    const usuario = this.obtenerUsuarioActual();
    return this.http.post(`${BASE}/Venta/AceptarPedido`, null, {
      params: new HttpParams()
        .set('idDelivery', idDelivery.toString())
        .set('usuario', usuario),
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  iniciarDelivery(idDelivery: number): Observable<any> {
    const usuario = this.obtenerUsuarioActual();
    return this.http.post(`${BASE}/Venta/IniciarDelivery`, null, {
      params: new HttpParams()
        .set('idDelivery', idDelivery.toString())
        .set('usuario', usuario),
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  completarEntrega(idDelivery: number): Observable<any> {
    const usuario = this.obtenerUsuarioActual();
    return this.http.post(`${BASE}/Venta/CompletarEntrega`, null, {
      params: new HttpParams()
        .set('idDelivery', idDelivery.toString())
        .set('usuario', usuario),
      headers: this.getHeaders()
    }).pipe(catchError(this.handleError));
  }

  private obtenerUsuarioActual(): string {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.username || 'repartidor';
    }
    return 'repartidor';
  }

  private handleError(error: any): Observable<any> {
    console.error('RepartidorService Error:', error);
    return of(null);
  }
}