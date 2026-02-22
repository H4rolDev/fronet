import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private apiUrl = "https://localhost:7223/api";

  constructor(private http: HttpClient) {}

  traerProductos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Torta/ObtenerCombo`);
  }
}
