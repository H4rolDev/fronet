import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CarritoService, ItemCarrito } from '../../services/carrito.service';

@Component({ selector: 'app-customer-cart', standalone: true, imports: [CommonModule, RouterModule], templateUrl: './customer-cart.component.html', styleUrl: './customer-cart.component.css' })
export class CustomerCartComponent implements OnInit {
  items: ItemCarrito[] = [];
  constructor(public cart: CarritoService) {}
  ngOnInit(): void { this.cart.carrito$.subscribe(items => this.items = items); }
  change(item: ItemCarrito, amount: number): void { this.cart.actualizarCantidad(item.id, item.cantidad + amount, item.stock); }
  remove(item: ItemCarrito): void { this.cart.eliminarProducto(item.id); }
}
