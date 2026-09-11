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
  size = 'Mediana';
  floors = 1;
  quantity = 1;
  message = '';
  fillings: string[] = ['Chocolate', 'Vainilla', 'Fresa', 'Maracuyá', 'Oreo', 'Manjar blanco'];
  flavors: string[] = ['Vainilla', 'Chocolate'];
  colors: string[] = ['Rosa pastel', 'Celeste', 'Dorado', 'Blanco perla', 'Chocolate'];
  sizes: string[] = ['S', 'M', 'L'];
  options: CustomerOption[] = [];
  filling = this.fillings[0];
  flavor = this.flavors[0];
  color = this.colors[3];

  constructor(private catalog: CustomerCatalogService, private cart: CarritoService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.catalogOnly = this.router.url.startsWith('/products');
    this.route.queryParamMap.subscribe(params => {
      this.search = params.get('search') || '';
      this.applyFilter();
    });
    this.catalog.obtenerProductos().subscribe({
      next: products => { this.products = products; this.categories = ['Todas', ...new Set(products.map(p => p.categoria))]; this.applyFilter(); this.loading = false; },
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
    this.sizes = product.tamanios.length ? product.tamanios : ['M'];
    this.size = this.sizes[0] || 'M';
    this.floors = 1; this.quantity = 1; this.message = ''; this.flavor = this.flavors[0]; this.filling = this.fillings[0]; this.color = this.colors[3];
    this.catalog.obtenerOpciones(product.id).subscribe({
      next: options => {
        this.options = options;
        const values = (type: CustomerOption['tipo']) => options.filter(option => option.tipo === type).sort((a, b) => a.orden - b.orden);
        const sizes = values('tamanio').map(option => option.valor);
        const flavors = values('sabor').map(option => option.valor);
        const fillings = values('relleno').map(option => option.valor);
        const colors = values('color').map(option => option.valor);
        if (sizes.length) { this.sizes = sizes; this.size = sizes[0]; }
        if (flavors.length) { this.flavors = flavors; this.flavor = flavors[0]; }
        if (fillings.length) { this.fillings = fillings; this.filling = fillings[0]; }
        if (colors.length) { this.colors = colors; this.color = colors[0]; }
      },
    });
  }

  price(): number {
    const extra = this.options
      .filter(option => (option.tipo === 'tamanio' && option.valor === this.size) ||
        (option.tipo === 'sabor' && option.valor === this.flavor) ||
        (option.tipo === 'relleno' && option.valor === this.filling) ||
        (option.tipo === 'color' && option.valor === this.color) ||
        (option.tipo === 'pisos' && option.valor === String(this.floors)))
      .reduce((sum, option) => sum + Number(option.precioExtra || 0), 0);
    return (this.selected?.precio || 0) + extra + (this.options.some(option => option.tipo === 'pisos') ? 0 : Math.max(0, this.floors - 1) * 30);
  }

  add(): void {
    if (!this.selected || this.selected.stock < 1) return;
    const finalPrice = this.price();
    const customizationPrice = finalPrice - this.selected.precio;
    this.cart.agregarProducto({ id: this.selected.id, nombre: this.selected.nombre, precio: finalPrice, precioBase: this.selected.precio, precioPersonalizacion: customizationPrice, stock: this.selected.stock, imagen: this.selected.imagen }, this.quantity);
    this.cart.actualizarPersonalizacion(this.selected.id, { tamanio: this.size, pisos: this.floors, sabor: this.flavor, relleno: this.filling, colorDecoracion: this.color, mensaje: this.message });
    this.selected = null;
  }
}
