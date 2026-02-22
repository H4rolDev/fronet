import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  private apiUrl = "http://localhost:5000/admin/productos";

  constructor(private http: HttpClient) {}

  traerProductos(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
