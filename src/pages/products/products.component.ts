import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

interface ProductoModel {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen: string;
  stock: boolean;
  porciones: string;
}

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {

  // ========================
  // FILTROS
  // ========================
  textoBusqueda: string = '';
  precioMin: number = 0;
  precioMax: number = 500;
  disponibilidad: '' | 'con' | 'sin' = '';
  porcionesSeleccionadas: string = '';
  categoriaSeleccionada: string = '';
  mensajeNoResultados: boolean = false;

  // ========================
  // UI
  // ========================
  mostrarAlerta: boolean = false;
  mostrarCarrito: boolean = false;

  // ========================
  // DATA
  // ========================
  productos: ProductoModel[] = [
    { id: 1, nombre: 'Torta Arcoiris', descripcion: 'Capas de colores vibrantes', precio: 70, categoria: 'Tortas especiales', imagen: 'arcoiris.jpg', stock: true, porciones: '12' },
    { id: 2, nombre: 'Torta Oreo', descripcion: 'Con galletas Oreo', precio: 65, categoria: 'Tortas especiales', imagen: 'oreo.jpeg', stock: false, porciones: '16' },
    { id: 3, nombre: 'Torta Rosada', descripcion: 'Perfecta para quinceañera', precio: 180, categoria: 'Tortas quinceañeras', imagen: 'rosa.jpeg', stock: true, porciones: '24' },
    { id: 4, nombre: 'Torta con Brillos', descripcion: 'Decoración elegante', precio: 190, categoria: 'Tortas quinceañeras', imagen: 'roja.jpg', stock: false, porciones: '24' },
    { id: 5, nombre: 'Torta Blanca', descripcion: 'Ideal para bodas', precio: 220, categoria: 'Tortas matrimonio', imagen: 'blanca.jpeg', stock: true, porciones: '24' },
    { id: 6, nombre: 'Torta Floral', descripcion: 'Flores naturales', precio: 240, categoria: 'Tortas matrimonio', imagen: 'floral.jpeg', stock: true, porciones: '24' },
    { id: 7, nombre: 'Empanaditas dulces', descripcion: 'Relleno de manjar', precio: 25, categoria: 'Bocatitos', imagen: 'empanadas.jpeg', stock: true, porciones: '4-5' },
    { id: 8, nombre: 'Mini Sándwich', descripcion: 'Salados', precio: 28, categoria: 'Bocatitos', imagen: 'sandwich.jpeg', stock: false, porciones: '4-5' },
    { id: 9, nombre: 'Cheesecake', descripcion: 'Pastel de queso', precio: 38, categoria: 'Postres', imagen: 'cheesecake.jpeg', stock: true, porciones: '12' },
    { id: 10, nombre: 'Brownies', descripcion: 'Chocolate intenso', precio: 28, categoria: 'Postres', imagen: 'brownies.jpeg', stock: true, porciones: '8' }
  ];

  categorias: string[] = [
    'Tortas especiales',
    'Tortas quinceañeras',
    'Tortas matrimonio',
    'Bocatitos',
    'Postres'
  ];

  productosFiltrados: ProductoModel[] = [];
  carrito: ProductoModel[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  // ========================
  // INIT (CORREGIDO)
  // ========================
  ngOnInit(): void {

    this.cargarCarrito();

    // 🔥 ESCUCHAR CAMBIOS EN LA URL
    this.route.queryParams.subscribe(params => {
      this.textoBusqueda = params['search'] || '';
      this.filtrarProductos();
    });

  }

  // ========================
  // FILTRADO
  // ========================
  filtrarProductos(): void {

    const texto = this.textoBusqueda.toLowerCase().trim();

    this.productosFiltrados = this.productos.filter(p =>
      (this.categoriaSeleccionada === '' || p.categoria === this.categoriaSeleccionada) &&
      (texto === '' ||
        p.nombre.toLowerCase().includes(texto) ||
        p.descripcion.toLowerCase().includes(texto)
      ) &&
      (p.precio >= this.precioMin) &&
      (p.precio <= this.precioMax) &&
      (
        this.disponibilidad === '' ||
        (this.disponibilidad === 'con' && p.stock) ||
        (this.disponibilidad === 'sin' && !p.stock)
      ) &&
      (this.porcionesSeleccionadas === '' || p.porciones === this.porcionesSeleccionadas)
    );

    this.mensajeNoResultados = this.productosFiltrados.length === 0;
  }

  seleccionarCategoria(categoria: string): void {
    this.categoriaSeleccionada = categoria;
    this.filtrarProductos();
  }

  limpiarFiltros(): void {
    this.textoBusqueda = '';
    this.precioMin = 0;
    this.precioMax = 500;
    this.disponibilidad = '';
    this.porcionesSeleccionadas = '';
    this.categoriaSeleccionada = '';
    this.filtrarProductos();
  }

  // ========================
  // CARRITO
  // ========================
  agregarAlCarrito(producto: ProductoModel): void {
    this.carrito.push(producto);
    this.guardarCarrito();

    this.mostrarAlerta = true;
    setTimeout(() => this.mostrarAlerta = false, 2000);
  }

  eliminarDelCarrito(index: number): void {
    this.carrito.splice(index, 1);
    this.guardarCarrito();
  }

  get totalCarrito(): number {
    return this.carrito.reduce((total, producto) => total + producto.precio, 0);
  }

  irAlCarrito(): void {
    this.mostrarCarrito = false;
    this.router.navigate(['/carrito']);
  }

  // ========================
  // STORAGE SOLO CARRITO
  // ========================
  private guardarCarrito(): void {
    localStorage.setItem('carrito', JSON.stringify(this.carrito));
  }

  private cargarCarrito(): void {
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
      this.carrito = JSON.parse(carritoGuardado);
    }
  }
}