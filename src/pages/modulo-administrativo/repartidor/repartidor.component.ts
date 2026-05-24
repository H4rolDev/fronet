import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RepartidorService } from '../../../services/repartidor.service';
import { AuthService } from '../../../services/auth.service';
import { EstadoEntregaEnum, ESTADO_ENTREGA_NOMBRES } from '../../../enums';

interface PedidoRepartidor {
  id: number;
  idVenta: number;
  fechaVenta: string;
  cliente: string;
  clienteTelefono: string;
  direccion: string;
  referencia: string;
  telefonoContacto: string;
  nombreContacto: string;
  costoDelivery: number;
  idEstadoEntrega: number;
  estado: string;
  fechaAsignacion: string | null;
  fechaEntrega: string | null;
  puedeAceptar: boolean;
  puedeIniciar: boolean;
  puedeCompletar: boolean;
}

@Component({
  selector: 'app-repartidor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="repartidor-page">
      <header class="page-header">
        <div class="ph-l">
          <div class="ph-ico">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
              <rect x="1" y="3" width="15" height="13" rx="1"/>
              <path d="M16 8h4l3 3v5h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <div>
            <h2 class="ph-t">Mis Pedidos</h2>
            <p class="ph-s">Gestiona tus entregas asignadas</p>
          </div>
        </div>
        <button class="btn-refresh" (click)="cargarPedidos()">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
          Actualizar
        </button>
      </header>

      @if (cargando()) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Cargando pedidos...</p>
        </div>
      }

      @if (!cargando() && pedidos().length === 0) {
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#ccc" stroke-width="1.5">
            <rect x="1" y="3" width="15" height="13" rx="1"/>
            <path d="M16 8h4l3 3v5h-7V8z"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
          <p>No tienes pedidos asignados</p>
          <span class="empty-sub">Los pedidos aparecerán aquí cuando te asignen entregas</span>
        </div>
      }

      @if (!cargando() && pedidos().length > 0) {
        <div class="stats-row">
          <div class="stat-card pendiente">
            <span class="stat-num">{{ obtenerPorEstado(1) }}</span>
            <span class="stat-label">Pendientes</span>
          </div>
          <div class="stat-card aceptado">
            <span class="stat-num">{{ obtenerPorEstado(2) + obtenerPorEstado(3) }}</span>
            <span class="stat-label">Aceptados</span>
          </div>
          <div class="stat-card en-camino">
            <span class="stat-num">{{ obtenerPorEstado(4) }}</span>
            <span class="stat-label">En Camino</span>
          </div>
          <div class="stat-card entregado">
            <span class="stat-num">{{ obtenerPorEstado(5) }}</span>
            <span class="stat-label">Entregados</span>
          </div>
        </div>

        <div class="pedidos-grid">
          @for (p of pedidos(); track p.id) {
            <div class="pedido-card" [class]="'estado-' + p.idEstadoEntrega">
              <div class="card-header">
                <span class="badge-estado" [class]="getEstadoClase(p.idEstadoEntrega)">
                  {{ p.estado }}
                </span>
                <span class="venta-id">Pedido #{{ p.idVenta }}</span>
              </div>

              <div class="card-body">
                <div class="info-row">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <div>
                    <strong>{{ p.cliente }}</strong>
                    @if (p.clienteTelefono) {
                      <span class="tel">{{ p.clienteTelefono }}</span>
                    }
                  </div>
                </div>

                <div class="info-row">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <div>
                    <span>{{ p.direccion }}</span>
                    @if (p.referencia) {
                      <span class="ref">Ref: {{ p.referencia }}</span>
                    }
                  </div>
                </div>

                @if (p.nombreContacto || p.telefonoContacto) {
                  <div class="info-row">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
                    </svg>
                    <div>
                      @if (p.nombreContacto) {
                        <span>{{ p.nombreContacto }}</span>
                      }
                      @if (p.telefonoContacto) {
                        <span class="tel">{{ p.telefonoContacto }}</span>
                      }
                    </div>
                  </div>
                }

                <div class="info-row costo">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                  </svg>
                  <span>Costo delivery: <strong>S/. {{ p.costoDelivery.toFixed(2) }}</strong></span>
                </div>

                @if (p.fechaAsignacion) {
                  <div class="info-row fecha">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>Asignado: {{ formatFecha(p.fechaAsignacion) }}</span>
                  </div>
                }
              </div>

              <div class="card-actions">
                @if (p.puedeAceptar) {
                  <button class="btn-accion btn-aceptar" (click)="aceptarPedido(p.id)">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Aceptar Pedido
                  </button>
                }
                @if (p.puedeIniciar) {
                  <button class="btn-accion btn-iniciar" (click)="iniciarDelivery(p.id)">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Iniciar Delivery
                  </button>
                }
                @if (p.puedeCompletar) {
                  <button class="btn-accion btn-completar" (click)="completarEntrega(p.id)">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M9 12l2 2 4-4"/>
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Marcar Entregado
                  </button>
                }
                @if (p.idEstadoEntrega === 5) {
                  <span class="estado-completado">✓ Entregado</span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .repartidor-page { padding: 24px; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .ph-l { display: flex; align-items: center; gap: 16px; }
    .ph-ico { width: 52px; height: 52px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 14px; display: flex; align-items: center; justify-content: center; }
    .ph-ico svg { width: 26px; height: 26px; }
    .ph-t { margin: 0; font-size: 24px; font-weight: 700; color: #111; }
    .ph-s { margin: 4px 0 0; font-size: 14px; color: #6b7280; }
    .btn-refresh { display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: white; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; font-weight: 500; color: #555; }
    .btn-refresh:hover { border-color: #f59e0b; color: #f59e0b; }

    .loading { display: flex; flex-direction: column; align-items: center; padding: 60px; color: #888; }
    .spinner { width: 44px; height: 44px; border: 3px solid #e5e7eb; border-top-color: #f59e0b; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state { text-align: center; padding: 80px; color: #aaa; background: #f9fafb; border-radius: 16px; }
    .empty-state p { margin-top: 16px; font-size: 18px; color: #555; }
    .empty-sub { display: block; margin-top: 8px; font-size: 14px; color: #888; }

    .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: white; padding: 16px; border-radius: 12px; text-align: center; border: 1px solid #e5e7eb; }
    .stat-card.pendiente { border-left: 4px solid #f59e0b; }
    .stat-card.aceptado { border-left: 4px solid #3b82f6; }
    .stat-card.en-camino { border-left: 4px solid #8b5cf6; }
    .stat-card.entregado { border-left: 4px solid #10b981; }
    .stat-num { display: block; font-size: 28px; font-weight: 700; color: #111; }
    .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }

    .pedidos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px; }
    .pedido-card { background: white; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
    .pedido-card.estado-1 { border-left: 4px solid #f59e0b; }
    .pedido-card.estado-2 { border-left: 4px solid #3b82f6; }
    .pedido-card.estado-3 { border-left: 4px solid #8b5cf6; }
    .pedido-card.estado-4 { border-left: 4px solid #ec4899; }
    .pedido-card.estado-5 { border-left: 4px solid #10b981; }

    .card-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
    .badge-estado { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-estado.pendiente { background: #fef3c7; color: #d97706; }
    .badge-estado.asignado { background: #dbeafe; color: #2563eb; }
    .badge-estado.aceptado { background: #ede9fe; color: #7c3aed; }
    .badge-estado.en-camino { background: #fce7f3; color: #db2777; }
    .badge-estado.entregado { background: #d1fae5; color: #059669; }
    .venta-id { font-size: 13px; font-weight: 600; color: #333; }

    .card-body { padding: 16px; }
    .info-row { display: flex; gap: 10px; margin-bottom: 12px; color: #555; font-size: 14px; }
    .info-row:last-child { margin-bottom: 0; }
    .info-row svg { color: #9ca3af; flex-shrink: 0; margin-top: 2px; }
    .info-row div { display: flex; flex-direction: column; gap: 2px; }
    .info-row strong { color: #111; }
    .info-row .tel { color: #666; font-size: 13px; }
    .info-row .ref { color: #888; font-size: 12px; font-style: italic; }
    .info-row.costo { margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e5e7eb; }
    .info-row.costo strong { color: #f59e0b; font-size: 15px; }
    .info-row.fecha { color: #6b7280; font-size: 13px; }

    .card-actions { padding: 12px 16px; background: #f9fafb; border-top: 1px solid #e5e7eb; display: flex; gap: 10px; flex-wrap: wrap; }
    .btn-accion { display: flex; align-items: center; gap: 8px; padding: 12px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; flex: 1; justify-content: center; }
    .btn-aceptar { background: #3b82f6; color: white; }
    .btn-aceptar:hover { background: #2563eb; }
    .btn-iniciar { background: #f59e0b; color: white; }
    .btn-iniciar:hover { background: #d97706; }
    .btn-completar { background: #10b981; color: white; }
    .btn-completar:hover { background: #059669; }
    .estado-completado { color: #10b981; font-weight: 600; font-size: 14px; padding: 12px 20px; }
  `]
})
export class RepartidorComponent implements OnInit {
  pedidos = signal<PedidoRepartidor[]>([]);
  cargando = signal(false);
  idPersona = 0;

  constructor(
    private repartidorService: RepartidorService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.obtenerIdPersona();
    if (this.idPersona > 0) {
      this.cargarPedidos();
    }
  }

  private obtenerIdPersona(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.persona && user.persona.id) {
        this.idPersona = user.persona.id;
      }
    }
  }

  cargarPedidos(): void {
    if (this.idPersona === 0) return;
    
    this.cargando.set(true);
    this.repartidorService.obtenerMisPedidos(this.idPersona).subscribe({
      next: (data) => {
        this.pedidos.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error cargando pedidos:', err);
        this.cargando.set(false);
      }
    });
  }

  aceptarPedido(id: number): void {
    if (!confirm('¿Aceptar este pedido?')) return;
    
    this.repartidorService.aceptarPedido(id).subscribe({
      next: () => {
        alert('Pedido aceptado');
        this.cargarPedidos();
      },
      error: (err) => alert('Error: ' + err.message)
    });
  }

  iniciarDelivery(id: number): void {
    if (!confirm('¿Iniciar el delivery?')) return;
    
    this.repartidorService.iniciarDelivery(id).subscribe({
      next: () => {
        alert('Delivery iniciado');
        this.cargarPedidos();
      },
      error: (err) => alert('Error: ' + err.message)
    });
  }

  completarEntrega(id: number): void {
    if (!confirm('¿Confirmar que el pedido fue entregado?')) return;
    
    this.repartidorService.completarEntrega(id).subscribe({
      next: () => {
        alert('Entrega completada');
        this.cargarPedidos();
      },
      error: (err) => alert('Error: ' + err.message)
    });
  }

  obtenerPorEstado(estado: number): number {
    return this.pedidos().filter(p => p.idEstadoEntrega === estado).length;
  }

  getEstadoClase(estado: number): string {
    switch (estado) {
      case 1: return 'pendiente';
      case 2: return 'asignado';
      case 3: return 'aceptado';
      case 4: return 'en-camino';
      case 5: return 'entregado';
      default: return 'pendiente';
    }
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
}