import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private url = 'http://localhost/php/contacto.php';

  constructor(private http: HttpClient) {}

  enviarMensaje(data: { nombre: string; email: string; mensaje: string }) {
    return this.http.post(this.url, data);
  }
}
