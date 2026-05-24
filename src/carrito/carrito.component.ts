import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CarritoService, ItemCarrito } from '../../services/carrito.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './carrito.component.html',
  styleUrls: ['./carrito.component.css']
})
export class CarritoComponent implements OnInit, OnDestroy {
  items: ItemCarrito[] = [];
  total = 0;
  private sub?: Subscription;

  constructor(
    private router: Router,
    private carritoService: CarritoService
  ) {}

  ngOnInit(): void {
    this.sub = this.carritoService.carrito$.subscribe(items => {
      this.items = items;
      this.total = this.carritoService.obtenerTotal();
    });
    this.items = this.carritoService.obtenerCarrito();
    this.total = this.carritoService.obtenerTotal();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  actualizarCantidad(id: number, cambio: number): void {
    const item = this.items.find(i => i.id === id);
    if (item) {
      let nuevaCantidad = item.cantidad + cambio;
      if (nuevaCantidad < 1) nuevaCantidad = 1;
      if (nuevaCantidad > item.stock) nuevaCantidad = item.stock;
      this.carritoService.actualizarCantidad(id, nuevaCantidad, item.stock);
    }
  }

  eliminarItem(id: number): void {
    if (confirm('¿Eliminar este producto del carrito?')) {
      this.carritoService.eliminarProducto(id);
    }
  }

  irAPagar(): void {
    if (this.items.length === 0) {
      alert('El carrito está vacío');
      return;
    }
    this.router.navigate(['/pagar']);
  }

  hayItems(): boolean {
    return this.items.length > 0;
  }
}