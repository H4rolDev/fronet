import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CustomerCatalogService, CustomerOption, CustomerProduct } from '../../services/customer-catalog.service';
import { CarritoService } from '../../services/carrito.service';

@Component({
  selector: 'app-customer-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './customer-home.component.html',
  styleUrl: './customer-home.component.css'
})
export class CustomerHomeComponent implements OnInit {
  products: CustomerProduct[] = [];
  filtered: CustomerProduct[] = [];
  categories: string[] = ['Todas'];
  category = 'Todas';
  search = '';
  loading = true;
  catalogOnly = false;
  pageSize = 6;
  currentPage = 1;
  sortBy = 'featured';
  selected: CustomerProduct | null = null;

  options: CustomerOption[] = [];
  optionsLoading = false;
  customizationError = '';
  size = '';
  floors = 1;
  maxFloors = 4;
  floorsConfigured = false;
  quantity = 1;
  message = '';
  filling = '';
  flavor = '';
  color = '';
  decoration = '';
  frosting = '';
  servings: number | null = null;
  notes = '';
  eventType = '';
  eventTypes: string[] = [];
  deliveryDate = '';
  referenceImage = '';
  referenceImageName = '';

  fillings: string[] = [];
  flavors: string[] = [];
  colors: string[] = [];
  sizes: string[] = [];
  decorations: string[] = [];
  frostings: string[] = [];
  portions: string[] = [];

  constructor(private catalog: CustomerCatalogService, private cart: CarritoService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.catalogOnly = this.router.url.startsWith('/products');
    this.route.queryParamMap.subscribe(params => {
      this.search = params.get('search') || '';
      this.applyFilter();
    });
    this.catalog.obtenerProductos().subscribe({
      next: products => {
        this.products = products;
        this.categories = ['Todas', ...new Set(products.map(p => p.categoria))];
        this.applyFilter();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilter(): void {
    const query = this.search.toLowerCase().trim();
    this.filtered = this.products.filter(p => (this.category === 'Todas' || p.categoria === this.category) &&
      (!query || p.nombre.toLowerCase().includes(query) || p.descripcion.toLowerCase().includes(query)));
    this.filtered = [...this.filtered].sort((a, b) => {
      if (this.sortBy === 'price-asc') return a.precio - b.precio;
      if (this.sortBy === 'price-desc') return b.precio - a.precio;
      if (this.sortBy === 'name') return a.nombre.localeCompare(b.nombre);
      return 0;
    });
    this.currentPage = 1;
  }

  visibleProducts(): CustomerProduct[] {
    if (!this.catalogOnly) return this.filtered.slice(0, 4);
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filtered.slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.max(1, Math.ceil(this.filtered.length / this.pageSize));
  }

  pages(): number[] {
    return Array.from({ length: this.totalPages() }, (_, index) => index + 1);
  }

  goToPage(page: number): void {
    this.currentPage = Math.min(Math.max(page, 1), this.totalPages());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  open(product: CustomerProduct): void {
    this.selected = product;
    this.options = [];
    this.optionsLoading = true;
    this.customizationError = '';
    this.sizes = product.tamanios;
    this.size = this.sizes[0] || '';
    this.floors = 1;
    this.quantity = 1;
    this.message = '';
    this.notes = '';
    this.eventType = '';
    this.deliveryDate = '';
    this.referenceImage = '';
    this.referenceImageName = '';
    this.filling = '';
    this.flavor = '';
    this.color = '';
    this.decoration = '';
         this.frosting = '';
         this.servings = null;
         this.maxFloors = 4;
         this.floorsConfigured = false;

    this.catalog.obtenerOpciones(product.id).subscribe({
      next: options => {
        this.options = options;
        this.optionsLoading = false;
        const values = (type: CustomerOption['tipo']) => options.filter(option => option.tipo === type).sort((a, b) => a.orden - b.orden);
        const configuredSizes = values('tamanio').map(o => o.valor);
        if (configuredSizes.length) this.sizes = configuredSizes;
        this.flavors = values('sabor').map(o => o.valor);
        this.fillings = values('relleno').map(o => o.valor);
        this.colors = values('color').map(o => o.valor);
        this.decorations = values('decoracion').map(o => o.valor);
        this.frostings = values('cobertura').map(o => o.valor);
        this.portions = values('porciones').map(o => o.valor);
         this.eventTypes = values('evento').map(o => o.valor);
         const floorOptions = values('pisos');
         const configuredMax = floorOptions.map(option => option.maximo).filter((value): value is number => Number(value) > 0);
          this.floorsConfigured = floorOptions.length > 0;
          this.maxFloors = configuredMax.length ? Math.max(...configuredMax) : 4;
         this.size = this.sizes[0] || '';
        this.flavor = this.flavors[0] || '';
        this.filling = this.fillings[0] || '';
        this.color = this.colors[0] || '';
        this.decoration = this.decorations[0] || '';
        this.frosting = this.frostings[0] || '';
        this.servings = Number(this.portions[0]?.match(/\d+/)?.[0]) || null;
      },
      error: () => {
        this.optionsLoading = false;
        this.customizationError = 'No se pudieron cargar las opciones de esta torta.';
      }
    });
  }

  clampFloors(): void {
    this.floors = Math.min(this.maxFloors, Math.max(1, Number(this.floors) || 1));
  }

  price(): number {
    const selectedValues: Record<string, string> = {
      tamanio: this.size, sabor: this.flavor, relleno: this.filling, color: this.color,
      decoracion: this.decoration, cobertura: this.frosting, porciones: this.servings ? String(this.servings) : '',
      pisos: String(this.floors), evento: this.eventType
    };
    let extra = Object.entries(selectedValues).reduce((sum, [tipo, valor]) => {
      if (!valor) return sum;
      const exact = this.options.find(option => option.tipo === tipo && this.optionMatches(option.valor, valor, tipo));
      const option = exact || this.options.find(item => item.tipo === tipo && item.modoPrecio === 'incremental');
      if (!option) return sum;
      if (option.modoPrecio === 'incremental') {
        const units = Number(valor);
        return sum + (Number(option.precioPorUnidad || 0) * Math.max(0, units - Number(option.minimo || 1)));
      }
      return sum + Number(option.precioExtra || 0);
    }, 0);
    if (!this.floorsConfigured) extra += Math.max(0, this.floors - 1) * 20;
    return Number(((this.selected?.precio || 0) + extra).toFixed(2));
  }

  customizationPrice(): number { return Number(Math.max(0, this.price() - Number(this.selected?.precio || 0)).toFixed(2)); }

  private optionMatches(optionValue: string, selectedValue: string, type: string): boolean {
    if (optionValue === selectedValue) return true;
    if (type !== 'pisos' && type !== 'porciones') return false;
    const optionNumber = Number(optionValue.match(/\d+(?:\.\d+)?/)?.[0]);
    return Number.isFinite(optionNumber) && optionNumber === Number(selectedValue);
  }

  add(): void {
    if (!this.selected || this.selected.stock < 1 || this.optionsLoading || this.customizationError) return;
    this.customizationError = '';
    const requestedFloors = Number(this.floors);
    if (!Number.isInteger(requestedFloors) || requestedFloors < 1 || requestedFloors > this.maxFloors) {
      this.customizationError = `No puedes agregar más de ${this.maxFloors} pisos para esta torta.`;
      this.floors = Math.min(this.maxFloors, Math.max(1, requestedFloors || 1));
      return;
    }
    this.floors = requestedFloors;
    if (!this.selected.personalizable) {
      this.cart.agregarProducto({ id: this.selected.id, nombre: this.selected.nombre, precio: this.selected.precio, stock: this.selected.stock, imagen: this.selected.imagen }, this.quantity);
      this.selected = null;
      return;
    }
    if ((!this.size && this.sizes.length) || (!this.flavor && this.flavors.length) || (!this.filling && this.fillings.length)) {
      this.customizationError = 'Completa las opciones obligatorias antes de agregar la torta.';
      return;
    }
    const finalPrice = this.price();
    const customizationPrice = Number((finalPrice - this.selected.precio).toFixed(2));
    const configuracion = {
      tamanio: this.size, pisos: this.floors, sabor: this.flavor, relleno: this.filling,
      color: this.color, decoracion: this.decoration, cobertura: this.frosting,
      porciones: this.servings, mensaje: this.message, evento: this.eventType,
      fechaEntrega: this.deliveryDate, observaciones: this.notes
    };
    const lineId = `${this.selected.id}:${this.hash(configuracion)}`;
    this.cart.agregarProducto({
      id: this.selected.id,
      lineId,
      nombre: this.selected.nombre,
      precio: finalPrice,
      precioBase: this.selected.precio,
      precioPersonalizacion: customizationPrice,
      stock: this.selected.stock,
      imagen: this.selected.imagen,
      configuracion,
      maxPisos: this.maxFloors
    }, this.quantity);
    this.cart.actualizarPersonalizacion(lineId, {
      tamanio: this.size,
      pisos: this.floors,
      sabor: this.flavor,
      relleno: this.filling,
      colorDecoracion: this.color,
      decoracion: this.decoration,
      observaciones: this.notes,
      porciones: this.servings ?? undefined,
      fechaEntrega: this.deliveryDate,
      imagenReferencia: this.referenceImage,
      mensaje: this.message
    });
    this.selected = null;
  }

  onReferenceImage(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      this.customizationError = 'La imagen debe ser válida y no superar 5 MB.';
      return;
    }
    this.referenceImageName = file.name;
    const reader = new FileReader();
    reader.onload = () => this.referenceImage = String(reader.result || '');
    reader.readAsDataURL(file);
  }

  parsePortions(value: string): number {
    return Number(value.match(/\d+/)?.[0] || 0);
  }

  private hash(value: unknown): string {
    const serialized = JSON.stringify(value);
    let hash = 2166136261;
    for (let i = 0; i < serialized.length; i++) hash = Math.imul(hash ^ serialized.charCodeAt(i), 16777619);
    return (hash >>> 0).toString(36);
  }
}
