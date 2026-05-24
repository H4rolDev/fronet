import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ProductoService } from '../../services/producto.service';
import { CarritoService, ItemCarrito } from '../../services/carrito.service';
import { ListadoTortaDTO } from '../../dtos/listado-torta.dto';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgIf],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit, OnDestroy {
  textoBusqueda: string = '';
  precioMin: number = 0;
  precioMax: number = 500;
  disponibilidad: '' | 'con' | 'sin' = '';
  mensajeNoResultados: boolean = false;
  mostrarAlerta: boolean = false;
  mostrarCarrito: boolean = false;
  sidebarVisible: boolean = false;
  cargando: boolean = true;

  listadoTortas: ListadoTortaDTO[] = [];
  productosFiltrados: ListadoTortaDTO[] = [];
  carrito: any[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private productosService: ProductoService,
    private carritoService: CarritoService
  ) {}

  ngOnInit(): void {
    this.carritoService.carrito$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => {
        this.carrito = items;
      });
    this.carrito = this.carritoService.obtenerCarrito();

    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.textoBusqueda = params['search'] || '';
        if (this.listadoTortas.length > 0) {
          this.filtrarProductos();
        }
      });

    this.productosService.traerProductos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.listadoTortas = Array.isArray(data) ? data : [];
          this.cargando = false;
          this.filtrarProductos();
        },
        error: (err) => {
          console.error('Error al obtener productos:', err);
          this.cargando = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  filtrarProductos(): void {
    const texto = this.textoBusqueda.toLowerCase().trim();
    this.productosFiltrados = this.listadoTortas.filter(p =>
      (texto === '' ||
        p.nombre.toLowerCase().includes(texto) ||
        p.descripcion.toLowerCase().includes(texto)) &&
      p.precioVenta >= this.precioMin &&
      p.precioVenta <= this.precioMax &&
      (this.disponibilidad === '' ||
        (this.disponibilidad === 'con' && p.stockDisponible > 0) ||
        (this.disponibilidad === 'sin' && p.stockDisponible === 0))
    );
    this.mensajeNoResultados = this.productosFiltrados.length === 0;
  }

  hayFiltrosActivos(): boolean {
    return !!(this.textoBusqueda || this.precioMin > 0 || this.precioMax < 500 || this.disponibilidad);
  }

  limpiarFiltros(): void {
    this.textoBusqueda = '';
    this.precioMin = 0;
    this.precioMax = 500;
    this.disponibilidad = '';
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    this.filtrarProductos();
  }

  agregarAlCarrito(producto: ListadoTortaDTO): void {
    this.carritoService.agregarProducto({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precioVenta,
      stock: producto.stockDisponible,
      imagen: producto.imagenUrl
    }, 1);
    this.carrito = this.carritoService.obtenerCarrito();
    this.mostrarAlerta = true;
    setTimeout(() => this.mostrarAlerta = false, 2500);
  }

  eliminarDelCarrito(id: number): void {
    this.carritoService.eliminarProducto(id);
    this.carrito = this.carritoService.obtenerCarrito();
  }

  actualizarCantidad(id: number, cambio: number): void {
    const item = this.carrito.find(i => i.id === id);
    if (item) {
      const nuevaCantidad = item.cantidad + cambio;
      if (nuevaCantidad > 0 && nuevaCantidad <= item.stock) {
        this.carritoService.actualizarCantidad(id, nuevaCantidad, item.stock);
        this.carrito = this.carritoService.obtenerCarrito();
      }
    }
  }

  get totalCarrito(): number {
    return this.carritoService.obtenerTotal();
  }

  get cantidadCarrito(): number {
    return this.carritoService.obtenerCantidadTotal();
  }

  irAlCarrito(): void {
    this.mostrarCarrito = false;
    this.router.navigate(['/pagar']);
  }

  private cargarCarrito(): void {
    this.carrito = this.carritoService.obtenerCarrito();
  }
}
