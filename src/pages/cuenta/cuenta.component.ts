import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface User {
direccion: any;
celular: any;
nombre: any;
  // Define aquí las propiedades que esperas del user para tipado fuerte
  id: number;
  name: string;
  email: string;
  // cualquier otra propiedad que tengas
}

@Component({
  selector: 'app-cuenta',
  templateUrl: './cuenta.component.html',
  styleUrls: ['./cuenta.component.css'],
  imports: [CommonModule]
})
export class CuentaComponent implements OnInit {
changePhoto() {
throw new Error('Method not implemented.');
}
editField(arg0: string) {
throw new Error('Method not implemented.');
}
  user: User | null = null;

  constructor(public router: Router) {}

  ngOnInit(): void {
    this.checkUser();
  }

  private checkUser(): void {
    const userStr = localStorage.getItem('user');

    if (!userStr) {
      this.redirectToLogin();
      return;
    }

    try {
      this.user = JSON.parse(userStr) as User;
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      this.redirectToLogin();
    }
  }

  logout(): void {
    localStorage.removeItem('user');
    this.redirectToLogin();
  }

  private redirectToLogin(): void {
    this.router.navigate(['/iniciar']);
  }
}
