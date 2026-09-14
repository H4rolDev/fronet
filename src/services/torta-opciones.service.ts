import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface TortaOpcion {
  id: number;
  idTorta: number;
  tipo: 'sabor' | 'tamanio' | 'relleno' | 'color' | 'pisos' | 'cobertura' | 'decoracion' | 'porciones' | 'evento';
  valor: string;
  precioExtra: number;
  modoPrecio?: 'fijo' | 'incremental';
  precioPorUnidad?: number;
  obligatorio?: boolean;
  minimo?: number | null;
  activo: boolean;
  maximo?: number | null;
  orden: number;
}

@Injectable({ providedIn: 'root' })
export class TortaOpcionesService {
  private readonly url = `${environment.apiUrl}/TortaOpcion`;
  constructor(private http: HttpClient) {}
  obtenerAdmin(idTorta: number): Observable<TortaOpcion[]> { return this.http.get<TortaOpcion[]>(`${this.url}/admin/torta/${idTorta}`); }
  guardar(opcion: TortaOpcion): Observable<TortaOpcion> { return this.http.post<TortaOpcion>(`${this.url}/upsert`, opcion); }
  eliminar(id: number): Observable<unknown> { return this.http.delete(`${this.url}/${id}`); }
}
