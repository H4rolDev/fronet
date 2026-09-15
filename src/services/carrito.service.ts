// carrito.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ItemCarrito {
  /** Stable identity for a product variant, not only the base cake id. */
  lineId: string;
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
  decoracion?: string;
  observaciones?: string;
  imagenReferencia?: string;
  porciones?: number;
  fechaEntrega?: string;
  configuracion?: Record<string, string | number | string[] | null>;
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private carrito: ItemCarrito[] = this.cargar();
  private carritoSubject = new BehaviorSubject<ItemCarrito[]>([...this.carrito]);

  carrito$ = this.carritoSubject.asObservable();

  private cargar(): ItemCarrito[] {
    try {
      const items = JSON.parse(localStorage.getItem('cart') || '[]');
      return Array.isArray(items) ? items.map(item => ({ ...item, lineId: item.lineId ?? String(item.id) })) : [];
    }
    catch { return []; }
  }

  private publicar(): void {
    localStorage.setItem('cart', JSON.stringify(this.carrito));
    this.carritoSubject.next([...this.carrito]);
  }

  agregarProducto(producto: { id: number; nombre: string; precio: number; stock: number; imagen?: string; precioBase?: number; precioPersonalizacion?: number; lineId?: string; configuracion?: ItemCarrito['configuracion']; maxPisos?: number }, cantidad: number = 1) {
    if (cantidad <= 0) return;
    const pisos = Number(producto.configuracion?.['pisos']);
    if (Number.isFinite(pisos) && producto.maxPisos != null && pisos > producto.maxPisos) {
      alert(`Esta torta permite como máximo ${producto.maxPisos} pisos.`);
      return;
    }
    const lineId = producto.lineId ?? String(producto.id);
    const cantidadEnCarrito = this.carrito.filter(item => item.lineId === lineId).reduce((sum, item) => sum + item.cantidad, 0);
    if (cantidadEnCarrito + cantidad > producto.stock) {
      alert(`Stock máximo disponible: ${producto.stock}`);
      cantidad = Math.max(0, producto.stock - cantidadEnCarrito);
    }
    if (cantidad === 0) return;
    
    const existente = this.carrito.find(item => item.lineId === lineId);
    
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
        lineId,
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        precioBase: producto.precioBase ?? producto.precio,
        precioPersonalizacion: producto.precioPersonalizacion ?? 0,
        cantidad: cantidad,
        stock: producto.stock,
        imagen: producto.imagen,
        configuracion: producto.configuracion
      });
    }
    
    this.publicar();
  }

  actualizarPersonalizacion(key: string | number, datos: Partial<ItemCarrito>): void {
    const item = this.buscar(key);
    if (item) { Object.assign(item, datos); this.publicar(); }
  }

  actualizarCantidad(key: string | number, cantidad: number, stock: number) {
    const item = this.buscar(key);
    if (item) {
      if (cantidad <= 0) {
        this.eliminarProducto(key);
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

  eliminarProducto(key: string | number) {
    this.carrito = this.carrito.filter(item => item.lineId !== String(key) && item.id !== key);
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

  private buscar(key: string | number): ItemCarrito | undefined {
    return this.carrito.find(item => item.lineId === String(key) || item.id === key);
  }
}
