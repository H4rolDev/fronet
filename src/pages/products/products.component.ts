import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ProductoService } from '../../services/producto.service';
import { ListadoTortaDTO } from '../../dtos/listado-torta.dto';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
  carrito: ListadoTortaDTO[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private productosService: ProductoService
  ) {}

  ngOnInit(): void {
    this.cargarCarrito();

    // ─── Suscripción 1: queryParams (siempre activa durante la vida del componente)
    // Cada vez que el navbar cambie ?search=..., esto se dispara
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.textoBusqueda = params['search'] || '';
        // Si los datos ya están cargados, filtrar de inmediato
        // Si no, el next() del servicio llamará filtrarProductos() cuando terminen de llegar
        if (this.listadoTortas.length > 0) {
          this.filtrarProductos();
        }
      });

    // ─── Suscripción 2: servicio (se llama una sola vez para cargar los datos)
    this.productosService.traerProductos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.listadoTortas = Array.isArray(data) ? data : [];
          this.cargando = false;
          // Aplicar filtro ahora que los datos llegaron
          // textoBusqueda ya fue asignado por el queryParams.subscribe arriba
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
    this.carrito.push(producto);
    this.guardarCarrito();
    this.mostrarAlerta = true;
    setTimeout(() => this.mostrarAlerta = false, 2500);
  }

  eliminarDelCarrito(index: number): void {
    this.carrito.splice(index, 1);
    this.guardarCarrito();
  }

  get totalCarrito(): number {
    return this.carrito.reduce((total, p) => total + p.precioVenta, 0);
  }

  irAlCarrito(): void {
    this.mostrarCarrito = false;
    this.router.navigate(['/carrito']);
  }

  private guardarCarrito(): void {
    localStorage.setItem('carrito', JSON.stringify(this.carrito));
  }

  private cargarCarrito(): void {
    const saved = localStorage.getItem('carrito');
    if (saved) this.carrito = JSON.parse(saved);
  }
}
