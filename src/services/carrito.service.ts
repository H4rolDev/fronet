// carrito.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ItemCarrito {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  stock: number;
  imagen?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private carrito: ItemCarrito[] = [];
  private carritoSubject = new BehaviorSubject<ItemCarrito[]>([]);

  carrito$ = this.carritoSubject.asObservable();

  agregarProducto(producto: { id: number; nombre: string; precio: number; stock: number; imagen?: string }, cantidad: number = 1) {
    if (cantidad <= 0) return;
    if (cantidad > producto.stock) {
      alert(`Stock máximo disponible: ${producto.stock}`);
      cantidad = producto.stock;
    }
    
    const existente = this.carrito.find(item => item.id === producto.id);
    
    if (existente) {
      const nuevaCantidad = existente.cantidad + cantidad;
      if (nuevaCantidad > producto.stock) {
        alert(`Stock máximo disponible: ${producto.stock}. Ya tienes ${existente.cantidad} en el carrito.`);
        existente.cantidad = producto.stock;
      } else {
        existente.cantidad = nuevaCantidad;
      }
    } else {
      this.carrito.push({
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: cantidad,
        stock: producto.stock,
        imagen: producto.imagen
      });
    }
    
    this.carritoSubject.next([...this.carrito]);
  }

  actualizarCantidad(id: number, cantidad: number, stock: number) {
    const item = this.carrito.find(i => i.id === id);
    if (item) {
      if (cantidad <= 0) {
        this.eliminarProducto(id);
        return;
      }
      if (cantidad > stock) {
        alert(`Stock máximo disponible: ${stock}`);
        cantidad = stock;
      }
      item.cantidad = cantidad;
      this.carritoSubject.next([...this.carrito]);
    }
  }

  eliminarProducto(id: number) {
    this.carrito = this.carrito.filter(item => item.id !== id);
    this.carritoSubject.next(this.carrito);
  }

  obtenerCarrito(): ItemCarrito[] {
    return [...this.carrito];
  }

  limpiarCarrito() {
    this.carrito = [];
    this.carritoSubject.next(this.carrito);
  }

  obtenerTotal(): number {
    return this.carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  }

  obtenerCantidadTotal(): number {
    return this.carrito.reduce((total, item) => total + item.cantidad, 0);
  }
}
