import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Torta, TortaListadoDTO } from '../models/torta';

@Injectable({ providedIn: 'root' })
export class TortaService {
  private base = `https://localhost:7223/api/Torta`;

  constructor(private http: HttpClient) {}

  insertarConImagen(form: FormData): Observable<number> {
    return this.http.post<number>(`${this.base}/InsertarConImagen`, form);
  }

  modificar(torta: Torta): Observable<number> {
    return this.http.put<number>(`${this.base}/Modificar`, torta);
  }

  eliminar(id: number, usuario: string): Observable<number> {
    const params = new HttpParams().set('id', id).set('usuario', usuario);
    return this.http.delete<number>(`${this.base}/Eliminar`, { params });
  }

  obtenerPorId(id: number): Observable<Torta> {
    const params = new HttpParams().set('id', id);
    return this.http.get<Torta>(`${this.base}/ObtenerListadoPorId`, { params });
  }

  obtenerCombo(): Observable<TortaListadoDTO[]> {
    return this.http.get<TortaListadoDTO[]>(`${this.base}/ObtenerCombo`);
  }

  modificarConImagen(form: FormData): Observable<number> {
    return this.http.put<number>(`${this.base}/ModificarConImagen`, form);
  }
}
