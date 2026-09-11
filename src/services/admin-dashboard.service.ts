import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { environment } from '../environments/environment';

export interface AdminDashboardData {
  dashboard: any;
  inventario: any;
  insumos: any[];
  ventas: any[];
  pendientes: any[];
  producciones: any[];
}

export interface AdminDashboardAlerts {
  ventas: any[];
  insumos: any[];
  pendientes: any[];
}

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly base = environment.apiUrl;
  private readonly requestTimeoutMs = 10000;

  constructor(private http: HttpClient) {}

  private ultimasVentas(): Observable<any[]> {
    const params = new HttpParams().set('pagina', '1').set('tamanioPagina', '25');
    return this.http.get<any>(`${this.base}/Venta/ObtenerTodos`, { params }).pipe(
      map(response => Array.isArray(response) ? response : response?.items ?? []),
      timeout(this.requestTimeoutMs),
      catchError(() => of([])),
    );
  }

  cargar(): Observable<AdminDashboardData> {
    return forkJoin({
      // Los indicadores se calculan con listados ya usados por los módulos.
      // Evita ejecutar reportes agregados costosos al abrir el dashboard.
      dashboard: of({}),
      inventario: of({ insumos: [] }),
      insumos: this.http.get<any[]>(`${this.base}/Insumo/ObtenerCombo`).pipe(
        timeout(this.requestTimeoutMs), catchError(() => of([]))),
      // El listado completo puede crecer indefinidamente. El dashboard solo
      // necesita las ventas recientes para sus tarjetas y su actividad.
      ventas: this.ultimasVentas(),
      pendientes: this.http.get<any[]>(`${this.base}/Venta/ObtenerPendientesValidacion`).pipe(
        timeout(this.requestTimeoutMs), catchError(() => of([]))),
      producciones: this.http.get<any[]>(`${this.base}/Produccion/ObtenerProducciones`).pipe(
        timeout(this.requestTimeoutMs), catchError(() => of([]))),
    });
  }

  cargarAlertas(): Observable<AdminDashboardAlerts> {
    return forkJoin({
      ventas: this.ultimasVentas(),
      // Las alertas del layout solo detectan pedidos nuevos; no descargues
      // nuevamente inventario y pendientes en cada ciclo.
      insumos: of([]),
      pendientes: of([]),
    });
  }

  detalleVenta(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/Venta/Detalle`, { params: { idVenta: id } });
  }
}
