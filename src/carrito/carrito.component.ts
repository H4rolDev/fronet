import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-carrito',
  standalone: true,
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css'],
  imports: [CommonModule]
})
export class CarritoComponent {
  total = 0;

  constructor(private router: Router) {}

  irAPago(): void {
    this.router.navigate(['/pago']);
  }

  // Aquí puedes tener funciones para calcular total, eliminar productos, etc.
}
