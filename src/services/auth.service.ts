import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface PersonaInfo {
  id: number;
  tipoDocumento: string;
  numeroDocumento: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  telefono?: string;
  direccion?: string;
  razonSocial?: string;
}

export interface UserInfo {
  idUsuario: number;
  username: string;
  token: string;
  roles: string[];
  persona?: PersonaInfo;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/Auth/Login`, { username, password });
  }

  register(data: {
    username: string;
    password: string;
    idTipoDocumento: number;
    numeroDocumento: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno?: string;
    telefono?: string;
    direccion?: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/Auth/Register`, data);
  }

  logout(): void {
    localStorage.removeItem('user');
  }

  getUser(): UserInfo | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('user');
  }

  hasRole(role: string): boolean {
    const user = this.getUser();
    if (!user) return false;
    return (user.roles as string[]).includes(role);
  }

  isAdmin(): boolean {
    return this.hasRole('Administrador');
  }

  isCliente(): boolean {
    return this.hasRole('Cliente');
  }

  getToken(): string | null {
    const user = this.getUser();
    return user?.token ?? null;
  }

  getPersonaId(): number | null {
    const user = this.getUser();
    return user?.persona?.id ?? null;
  }

  getPersona(): PersonaInfo | null {
    const user = this.getUser();
    return user?.persona ?? null;
  }
}
