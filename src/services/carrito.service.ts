// carrito.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ProductoModel } from '../models/producto.model';


@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private carrito: ProductoModel[] = [];
  private carritoSubject = new BehaviorSubject<ProductoModel[]>([]);

  carrito$ = this.carritoSubject.asObservable();

  agregarProducto(producto: ProductoModel) {
    this.carrito.push(producto);
    this.carritoSubject.next(this.carrito);
  }

  eliminarProducto(index: number) {
    this.carrito.splice(index, 1);
    this.carritoSubject.next(this.carrito);
  }

  obtenerCarrito(): ProductoModel[] {
    return [...this.carrito];
  }

  limpiarCarrito() {
    this.carrito = [];
    this.carritoSubject.next(this.carrito);
  }

  obtenerTotal(): number {
    return this.carrito.reduce((total, p) => total + p.precio, 0);
  }
}


