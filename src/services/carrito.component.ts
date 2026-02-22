import { Component, OnInit } from '@angular/core';
import { CarritoService } from '../services/carrito.service';
import { Producto } from '../models/producto';

@Component({
  selector: 'app-carrito',
  templateUrl: './carrito.component.html',
})
export class CarritoComponent implements OnInit {
  carrito: Producto[] = [];
  total: number = 0;

  constructor(private carritoService: CarritoService) {}

  ngOnInit(): void {
    this.cargarCarrito();
  }

  cargarCarrito() {
    this.carrito = this.carritoService.obtenerCarrito();
    this.total = this.carritoService.total();
  }

  eliminarDelCarrito(id: number) {
    this.carritoService.eliminar(id);
    this.cargarCarrito();
  }
}
