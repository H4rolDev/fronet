import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface CustomRequest {
  id: number; codigo: string; tokenAcceso?: string; descripcion: string; imagenReferencia?: string; evento?: string;
  sabor?: string; relleno?: string; tamano?: string; porciones?: number; pisos: number;
  cobertura?: string; colores?: string; textoDecorativo?: string; fechaEntregaSolicitada?: string;
  estimadoMinimo?: number; estimadoMaximo?: number; estado: string; fechaCreacion: string;
}
export interface CustomRequestDetail { solicitud: CustomRequest; cotizacion?: any; historial: any[]; }

@Injectable({ providedIn: 'root' })
export class CustomRequestService {
  private readonly url = `${environment.apiUrl}/SolicitudPersonalizada`;
  constructor(private http: HttpClient) {}
  estimate(data: { porciones?: number; pisos?: number; cobertura?: string }): Observable<any> {
    let params = new HttpParams();
    Object.entries(data).forEach(([key, value]) => { if (value !== undefined && value !== '') params = params.set(key, String(value)); });
    return this.http.get(`${this.url}/estimado`, { params });
  }
  create(data: any): Observable<CustomRequestDetail> { return this.http.post<CustomRequestDetail>(this.url, data); }
  uploadImage(imagenBase64: string): Observable<{ url: string }> { return this.http.post<{ url: string }>(`${this.url}/imagen`, { imagenBase64 }); }
  mine(): Observable<CustomRequest[]> { return this.http.get<CustomRequest[]>(`${this.url}/mis-solicitudes`); }
  detail(id: number): Observable<CustomRequestDetail> { return this.http.get<CustomRequestDetail>(`${this.url}/${id}`); }
  publicDetail(codigo: string, token: string): Observable<CustomRequestDetail> { return this.http.get<CustomRequestDetail>(`${this.url}/publica/${encodeURIComponent(codigo)}/${encodeURIComponent(token)}`); }
  adminList(state = ''): Observable<CustomRequest[]> { return this.http.get<CustomRequest[]>(`${this.url}/admin/listado`, { params: state ? { estado: state } : {} }); }
  quote(id: number, data: any): Observable<CustomRequestDetail> { return this.http.post<CustomRequestDetail>(`${this.url}/${id}/cotizar`, data); }
  state(id: number, estado: string, comentario?: string): Observable<CustomRequestDetail> { return this.http.post<CustomRequestDetail>(`${this.url}/${id}/estado`, { estado, comentario }); }
}
