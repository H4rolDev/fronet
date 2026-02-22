import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private apiUrl = "http://localhost:5000/generate_token";

  constructor(private httpClient: HttpClient){

  }
  generateToken() : Observable<any[]> {
    const headers = new HttpHeaders({
    })
    //envia
    return this.httpClient.post<any[]>(this.apiUrl, {}, {
      headers
    });
  }
}
