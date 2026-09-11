// carrito.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ItemCarrito {
  id: number;
  nombre: string;
  precio: number;
  precioBase?: number;
  precioPersonalizacion?: number;
  cantidad: number;
  stock: number;
  imagen?: string;
  mensaje?: string;
  tamanio?: string;
  pisos?: number;
  sabor?: string;
  relleno?: string;
  colorDecoracion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private carrito: ItemCarrito[] = this.cargar();
  private carritoSubject = new BehaviorSubject<ItemCarrito[]>([...this.carrito]);

  carrito$ = this.carritoSubject.asObservable();

  private cargar(): ItemCarrito[] {
    try { return JSON.parse(localStorage.getItem('cart') || '[]'); }
    catch { return []; }
  }

  private publicar(): void {
    localStorage.setItem('cart', JSON.stringify(this.carrito));
    this.carritoSubject.next([...this.carrito]);
  }

  agregarProducto(producto: { id: number; nombre: string; precio: number; stock: number; imagen?: string; precioBase?: number; precioPersonalizacion?: number }, cantidad: number = 1) {
    if (cantidad <= 0) return;
    const cantidadEnCarrito = this.carrito.filter(item => item.id === producto.id).reduce((sum, item) => sum + item.cantidad, 0);
    if (cantidadEnCarrito + cantidad > producto.stock) {
      alert(`Stock máximo disponible: ${producto.stock}`);
      cantidad = Math.max(0, producto.stock - cantidadEnCarrito);
    }
    if (cantidad === 0) return;
    
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
        precioBase: producto.precioBase ?? producto.precio,
        precioPersonalizacion: producto.precioPersonalizacion ?? 0,
        cantidad: cantidad,
        stock: producto.stock,
        imagen: producto.imagen
      });
    }
    
    this.publicar();
  }

  actualizarPersonalizacion(id: number, datos: Partial<ItemCarrito>): void {
    const item = this.carrito.find(i => i.id === id);
    if (item) { Object.assign(item, datos); this.publicar(); }
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
      this.publicar();
    }
  }

  eliminarProducto(id: number) {
    this.carrito = this.carrito.filter(item => item.id !== id);
    this.publicar();
  }

  obtenerCarrito(): ItemCarrito[] {
    return [...this.carrito];
  }

  limpiarCarrito() {
    this.carrito = [];
    this.publicar();
  }

  obtenerTotal(): number {
    return this.carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  }

  obtenerCantidadPorProducto(id: number): number {
    return this.carrito.filter(item => item.id === id).reduce((total, item) => total + item.cantidad, 0);
  }

  obtenerCantidadTotal(): number {
    return this.carrito.reduce((total, item) => total + item.cantidad, 0);
  }
}
