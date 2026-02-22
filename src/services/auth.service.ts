import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'https://localhost:7223/api';

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/Auth/Login`, { username, password });
  }

  register(nombre: string, username: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/Auth/Register`, { nombre, username, password });
  }

  logout(): void {
    localStorage.removeItem('user');
  }

  getUser(): any | null {
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
}
