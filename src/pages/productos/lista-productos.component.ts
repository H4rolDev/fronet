import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ProductoModel } from '../../models/producto.model';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lista-productos.component.html',
  styleUrls: ['./lista-productos.component.css'],
})
export class ProductosComponent implements OnInit {

  // 🔹 Categorías
  categorias: string[] = [
    'Cumpleaños',
    'Aniversarios',
    'Festivos',
    'Tortas especiales',
    'Tortas quinceañeras',
    'Tortas matrimonio',
    'Bocatitos',
    'Postres'
  ];

  // 🔹 Filtros
  categoriaSeleccionada = '';
  terminoBusqueda = '';
  precioMax = 999;

  // 🔹 Productos y carrito
  productos: ProductoModel[] = [];
  carrito: ProductoModel[] = [];

  constructor(private searchService: SearchService) {
    // 🔹 Productos de ejemplo
    this.productos = [
      new ProductoModel({
        id: 1,
        nombre: 'Torta Especial de Chocolate',
        descripcion: 'Rica torta con fudge',
        precio: 50,
        categoria: 'Tortas especiales',
        imagen: 'assets/tortas/especial-choco.jpg'
      }),
      new ProductoModel({
        id: 2,
        nombre: 'Torta de Boda Blanca',
        descripcion: 'Elegante para matrimonio',
        precio: 120,
        categoria: 'Tortas matrimonio',
        imagen: 'assets/tortas/matrimonio-blanca.jpg'
      }),
      new ProductoModel({
        id: 3,
        nombre: 'Torta de 15 años',
        descripcion: 'Con flores y diseño moderno',
        precio: 90,
        categoria: 'Tortas quinceañeras',
        imagen: 'assets/tortas/quinceañera.jpg'
      }),
    ];
  }

  // 🔹 Escuchar lo que se escribe en el buscador del header
  ngOnInit(): void {
    this.searchService.termino$.subscribe(termino => {
      this.terminoBusqueda = termino;
    });
  }

  // 🔹 Seleccionar categoría
  seleccionarCategoria(categoria: string): void {
    this.categoriaSeleccionada = categoria;
  }

  // 🔹 Obtener productos filtrados (CORAZÓN DEL SISTEMA)
  obtenerProductosFiltrados(): ProductoModel[] {
    return this.productos.filter(p =>
      (this.categoriaSeleccionada === '' || p.categoria === this.categoriaSeleccionada) &&
      p.nombre.toLowerCase().includes(this.terminoBusqueda.toLowerCase()) &&
      p.precio <= this.precioMax
    );
  }

  // 🔹 Carrito
  agregarAlCarrito(producto: ProductoModel): void {
    this.carrito.push(producto);
  }

  eliminarDelCarrito(index: number): void {
    this.carrito.splice(index, 1);
  }
}

