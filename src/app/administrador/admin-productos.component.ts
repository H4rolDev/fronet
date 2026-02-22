import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-productos',
  templateUrl: './admin-productos.component.html',
  styleUrls: ['./admin-productos.component.css']
})
export class AdminProductosComponent {
  productos = [
    { id: 1, nombre: 'Torta Chocolate', precio: 50 },
    { id: 2, nombre: 'Torta Vainilla', precio: 45 }
  ];
}
