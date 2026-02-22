import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../services/auth.service';

import AOS from 'aos';
import 'aos/dist/aos.css';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    CommonModule,
    FormsModule   // 👈 NECESARIO PARA ngModel
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  title = 'cakes';

  // 🔎 BUSCADOR
  terminoBusqueda = '';
  // 🔎 BUSCADOR


// 🔍 CONTROL VISUAL DEL BUSCADOR
   activo = false;

  toggleBusqueda() {
  this.activo = !this.activo;
}

  // 👤 USUARIO
  user: any = null;
  dropdownOpen = false;

  // 📦 PRODUCTOS (solo de ejemplo aquí)
  categorias = [
    'Tortas Especiales',
    'Quinceañeras',
    'Matrimonio',
    'Bocatitos',
    'Postres'
  ];

  categoriaSeleccionada = '';

  productos = [
    {
      nombre: 'Torta Arcoiris',
      descripcion: 'Colores vivos',
      precio: 45,
      imagen: 'arcoiris.jpg',
      categoria: 'Tortas Especiales'
    },
    {
      nombre: 'Torta XV',
      descripcion: 'Decoración elegante',
      precio: 60,
      imagen: 'quince.jpg',
      categoria: 'Quinceañeras'
    }
  ];

  // 🛒 CARRITO
  carrito: any[] = [];
  mostrarCarrito = false;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    AOS.init({
      duration: 1000,
      once: true
    });

    // usuario reactivo
    this.auth.user$.subscribe(user => {
      this.user = user;
    });
  }

  // 🔎 BUSCAR PRODUCTOS (DESDE EL HEADER)
  onBuscar() {
    localStorage.setItem('busqueda', this.terminoBusqueda);
    this.router.navigate(['/products']);
  }

  // 🔐 LOGIN
  isLoggedIn(): boolean {
    return !!this.user;
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  logout() {
    this.auth.logout();
    this.dropdownOpen = false;
    this.router.navigate(['/iniciar']);
  }

  // 🧁 FILTRO SIMPLE (si lo necesitas aquí)
  seleccionarCategoria(categoria: string) {
    this.categoriaSeleccionada = categoria;
  }

  obtenerProductosFiltrados() {
    if (!this.categoriaSeleccionada) {
      return this.productos;
    }
    return this.productos.filter(
      p => p.categoria === this.categoriaSeleccionada
    );
  }

  // 🛒 CARRITO
  agregarAlCarrito(producto: any) {
    this.carrito.push(producto);
  }

  eliminarDelCarrito(index: number) {
    this.carrito.splice(index, 1);
  }

  toggleCarrito() {
    this.mostrarCarrito = !this.mostrarCarrito;
  }
}

