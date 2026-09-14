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
  selected: CustomerProduct | null = null;

  options: CustomerOption[] = [];
  optionsLoading = false;
  customizationError = '';
  size = '';
  floors = 1;
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
    const source = this.catalogOnly ? this.products : this.products.slice(0, 4);
    this.filtered = source.filter(p => (this.category === 'Todas' || p.categoria === this.category) &&
      (!query || p.nombre.toLowerCase().includes(query) || p.descripcion.toLowerCase().includes(query)));
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

  price(): number {
    const selectedValues: Record<string, string> = {
      tamanio: this.size, sabor: this.flavor, relleno: this.filling, color: this.color,
      decoracion: this.decoration, cobertura: this.frosting, porciones: this.servings ? String(this.servings) : '',
      pisos: String(this.floors), evento: this.eventType
    };
    const extra = Object.entries(selectedValues).reduce((sum, [tipo, valor]) => {
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
      configuracion
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
