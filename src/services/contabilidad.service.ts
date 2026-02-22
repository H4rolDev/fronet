import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs/internal/Observable";

@Injectable({
  providedIn: 'root'
})
export class ContabilidadService {
  private apiUrl = "http://localhost:5000/contabilidad/pagar";

  constructor(private httpClient: HttpClient){

  }
  registrarPago(body: any) : Observable<any[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('xangulary')}`
    })
    //envia
    return this.httpClient.post<any[]>(this.apiUrl, body, {
      headers
    });
  }
}
