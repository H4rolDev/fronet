import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { PermisoService, ModuloPermiso } from '../../../services/permiso.service';
import { RolEnum } from '../../../enums';

@Component({
  standalone: true,
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css'],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NgIf],
})
export class AdminLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  userName = '';
  userInitials = '';
  userRoles: string[] = [];
  currentPageTitle = 'Dashboard';
  currentDate = '';
  modulosPermitidos: ModuloPermiso[] = [];

  private pageTitles: Record<string, string> = {
    '/admin/dashboard':          'Dashboard',
    '/admin/tortas':             'Tortas',
    '/admin/receta-torta':       'Recetas de Tortas',
    '/admin/produccion':         'Producción de Torta',
    '/admin/insumos':            'Insumos',
    '/admin/proveedores':        'Proveedores',
    '/admin/unidad-medida':      'Unidad de Medida',
    '/admin/movimiento-insumo': 'Movimiento de Insumos',
    '/admin/movimiento-torta':  'Movimiento de Tortas',
    '/admin/tipos-movimientos':  'Tipos de Movimientos',
    '/admin/categoria-torta':    'Categoría Torta',
    '/admin/venta':       'Venta de Tortas',
    '/admin/delivery':           'Delivery',
    '/admin/personal':           'Personal',
    '/admin/clientes':           'Clientes',
    '/admin/roles':            'Roles',
    '/admin/reportes':           'Reportes',
    '/admin/promocion-torta':    'Promoción Torta',
    '/admin/validar-pagos':       'Validar Pagos',
    '/admin/validar-entradas':    'Validar Entradas',
    '/admin/repartidor':         'Repartidor',
  };

  constructor(
    private router: Router, 
    private auth: AuthService,
    private permisoService: PermisoService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.setCurrentDate();
    this.trackRoute();
    this.modulosPermitidos = this.permisoService.obtenerModulosPermitidos();
  }

  private loadUserData(): void {
    const raw = localStorage.getItem('user');
    if (!raw) { this.router.navigate(['/iniciar']); return; }
    const user = JSON.parse(raw);
    this.userName  = user.username ?? 'Usuario';
    this.userRoles = user.roles ?? [];
    const names    = (user.persona?.nombres ?? this.userName).split(' ');
    this.userInitials = names.length >= 2
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : names[0].substring(0, 2).toUpperCase();
  }

  private setCurrentDate(): void {
    const now = new Date();
    this.currentDate = now.toLocaleDateString('es-PE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  private trackRoute(): void {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.currentPageTitle = this.pageTitles[e.urlAfterRedirects] ?? 'Admin';
      });
    this.currentPageTitle = this.pageTitles[this.router.url] ?? 'Admin';
  }

  toggleSidebar(): void { this.sidebarCollapsed = !this.sidebarCollapsed; }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/iniciar']).then(() => window.location.reload());
  }

  tieneAcceso(ruta: string): boolean {
    return this.permisoService.tieneAcceso(ruta);
  }
}
