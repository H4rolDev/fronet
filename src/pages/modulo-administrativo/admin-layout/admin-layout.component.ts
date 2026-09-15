import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { PermisoService, ModuloPermiso } from '../../../services/permiso.service';
import { RolEnum } from '../../../enums';
import { AdminDashboardService } from '../../../services/admin-dashboard.service';
import { Subscription, timer } from 'rxjs';
import { exhaustMap } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css'],
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, NgIf],
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  sidebarCollapsed = false;
  userName = '';
  userInitials = '';
  userRoles: string[] = [];
  currentPageTitle = 'Dashboard';
  currentDate = '';
  modulosPermitidos: ModuloPermiso[] = [];
  alerts: Array<{ id: number; title: string; body: string; read: boolean }> = [];
  notificationsOpen = false;
  private alertsRefresh?: Subscription;

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
    '/admin/recojo-tienda':      'Recojo en tienda',
    '/admin/configuracion-delivery': 'Configuración de delivery',
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
    public auth: AuthService,
    private permisoService: PermisoService,
    private dashboardService: AdminDashboardService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.setCurrentDate();
    this.trackRoute();
    this.modulosPermitidos = this.permisoService.obtenerModulosPermitidos();
    this.startAlertsPolling();
  }

  ngOnDestroy(): void { this.alertsRefresh?.unsubscribe(); }

  get unreadAlerts(): number { return this.alerts.filter(alert => !alert.read).length; }

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;
    if (this.notificationsOpen) this.alerts = this.alerts.map(alert => ({ ...alert, read: true }));
  }

  openAlert(alert: { id: number }): void {
    this.notificationsOpen = false;
    this.router.navigate(['/admin/venta'], { queryParams: { pedido: alert.id } });
  }

  private startAlertsPolling(): void {
    // Deja que el dashboard termine su carga inicial antes de consultar alertas.
    this.alertsRefresh = timer(10000, 60000)
      .pipe(exhaustMap(() => this.dashboardService.cargarAlertas()))
      .subscribe({ next: data => this.detectNewOrders(data.ventas ?? []) });
  }

  private detectNewOrders(ventas: any[]): void {
    const ids = ventas.map(venta => Number(venta.id ?? venta.idVenta)).filter(id => id > 0);
    const storedValue = localStorage.getItem('admin-seen-orders');
    const stored = JSON.parse(storedValue ?? '[]') as number[];
    if (storedValue === null) {
      localStorage.setItem('admin-seen-orders', JSON.stringify(ids));
      return;
    }

    const newIds = ids.filter(id => !stored.includes(id));
    if (!newIds.length) return;
    this.alerts = [
      ...newIds.map(id => ({ id, title: 'Nuevo pedido recibido', body: `Un cliente realizó el pedido #${id}.`, read: false })),
      ...this.alerts,
    ].slice(0, 20);
    localStorage.setItem('admin-seen-orders', JSON.stringify([...new Set([...stored, ...newIds])].slice(-200)));

    for (const id of newIds) {
      this.dashboardService.detalleVenta(id).subscribe({
        next: detail => {
          const name = detail?.cliente?.nombre;
          if (!name) return;
          this.alerts = this.alerts.map(alert => alert.id === id
            ? { ...alert, body: `El cliente ${name} hizo el pedido #${id}.` }
            : alert);
        },
      });
    }
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
